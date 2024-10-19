import dotenv from "dotenv";
import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";

// Load environment variables from .env.local file
dotenv.config({ path: ".env.local" });

// Initialize OpenAI client with API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Define tools (functions) that the AI can use for travel planning
const travelTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchFlights",
      description: "Search for flights between two locations",
      parameters: {
        type: "object",
        properties: {
          origin: { type: "string" },
          destination: { type: "string" },
          date: { type: "string" }
        },
        required: ["origin", "destination", "date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "searchHotels",
      description: "Search for hotels in a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
          checkIn: { type: "string" },
          checkOut: { type: "string" }
        },
        required: ["location", "checkIn", "checkOut"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getAttractions",
      description: "Get attractions in a location",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" }
        },
        required: ["location"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "checkBudget",
      description: "Check if total cost is within budget",
      parameters: {
        type: "object",
        properties: {
          totalCost: { type: "number" },
          budget: { type: "number" }
        },
        required: ["totalCost", "budget"]
      }
    }
  }
];

// Define color codes for console output
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

// Main function to plan a trip based on user input
async function planTrip(userInput: string): Promise<string> {
  console.log(YELLOW + "Starting trip planning for input:" + RESET, userInput);

  // Initialize conversation history with system message and user input
  let conversationHistory: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are an advanced travel planner. Plan a trip based on the user's input. 
      Use the provided tools to search for flights, hotels, attractions, check budget, and optimize the itinerary.
      Provide a detailed plan and explanation of your thought process.`
    },
    { role: "user", content: userInput }
  ];

  const MAX_ITERATIONS = 10;
  let iterations = 0;
  let planComplete = false;

  // Main planning loop
  while (iterations < MAX_ITERATIONS && !planComplete) {
    console.log(YELLOW + "Sending request to OpenAI..." + RESET);

    // Send conversation history to OpenAI and get response
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: conversationHistory,
      tools: travelTools,
      tool_choice: "auto"
    });

    const message = response.choices[0].message;
    console.log(YELLOW + "Received response from OpenAI:" + RESET, message);

    // Check if the AI wants to use any tools
    if (!message.tool_calls) {
      console.log(YELLOW + "No tool calls, checking if plan is complete" + RESET);
      planComplete = true;
      console.log(RED + `Planning completed in ${iterations} iterations` + RESET);
      return message.content || "Failed to generate a response.";
    }

    // Process tool calls if any
    console.log("Processing tool calls...");
    const toolResults = await Promise.all(
      message.tool_calls.map(async (toolCall) => {
        console.log(`Executing function: ${toolCall.function.name}`);
        // Execute the function and get the result
        const result = await executeFunction(toolCall.function.name, JSON.parse(toolCall.function.arguments));
        console.log(`Result for ${toolCall.function.name}:`, result);
        // Format the result as a tool response
        return {
          role: "tool" as const,
          content: JSON.stringify(result),
          tool_call_id: toolCall.id
        };
      })
    );

    // Add AI message and tool results to conversation history
    console.log("Adding new messages to conversation history");
    conversationHistory.push(message, ...toolResults);
    console.log("Current conversation history:", conversationHistory);
    iterations++;
  }

  // Return final plan or indicate max iterations reached
  return conversationHistory[conversationHistory.length - 1].content as string;
}

// Function to simulate execution of travel-related functions
async function executeFunction(name: string, args: any): Promise<any> {
  console.log(`Executing function ${name} with args:`, args);
  switch (name) {
    case "searchFlights":
      return { flight: "NY to Paris, $500" };
    case "searchHotels":
      return { hotel: "Grand Hotel Paris, $200/night" };
    case "getAttractions":
      return { attractions: ["Eiffel Tower ($25/person)", "Louvre Museum ($50/person)"] };
    case "checkBudget":
      return { withinBudget: args.totalCost <= args.budget };
    default:
      throw new Error(`Unknown function: ${name}`);
  }
}

// Immediately invoked async function to run the travel planner
(async () => {
  try {
    console.log("Starting travel planner...");
    const result = await planTrip("Plan a 3-day trip to Paris for 2 people with a budget of $2000");
    console.log("Final trip plan:", result);
  } catch (error) {
    console.error("Error planning trip:", error);
  }
})();
