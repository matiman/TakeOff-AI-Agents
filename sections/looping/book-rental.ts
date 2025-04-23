import dotenv from "dotenv";
import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";
import * as readline from "readline";

// Load environment variables from .env.local file
dotenv.config({ path: ".env.local" });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

interface User {
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    zipCode: string;
    booksBorrowed: number;
  }

  interface Library {
    libraryId: number;
    name: string;
    zipCode: string;
    phoneNumber: string;
    openingHours: { open: string; close: string };

  }

  interface Book {
    bookId: number;
    title: string;
    author: string;
    isbn: string;
    publicationDate: string; // Use string for date or consider using Date type
    genre: Genre;
  }
  
  enum Genre {
    Fiction = "Fiction",
    Dystopian = "Dystopian",
    Romance = "Romance",
    // Add other genres as necessary
  }

  interface BookCopy {
    copyId: number;
    bookId: number;
    libraryId: number;
    status: BookStatus;
  }
  
  enum BookStatus {
    Available = "Available",
    Borrowed = "Borrowed",
    Damaged = "Damaged",
    Lost = "Lost"
  }

  interface Borrowing {
    borrowingId: number;
    userId: number;
    copyId: number;
    borrowDate: string; // Use string for date or consider using Date type
    returnDueDate: string; // Use string for date or consider using Date type
    returnDate: string | null; // Nullable date
  }

  // Users Sample Data
const users: User[] = [
    {
      userId: 1,
      username: "johndoe",
      firstName: "John",
      lastName: "Doe",
      email: "johndoe@example.com",
      zipCode: "12345",
      booksBorrowed: 0
    },
    {
      userId: 2,
      username: "janedoe",
      firstName: "Jane",
      lastName: "Doe",
      email: "janedoe@example.com",
      zipCode: "23456",
      booksBorrowed: 0
    },
    {
      userId: 3,
      username: "alicew",
      firstName: "Alice",
      lastName: "Wonderland",
      email: "alicew@example.com",
      zipCode: "34567",
      booksBorrowed: 1
    },
    {
      userId: 4,
      username: "bobsmith",
      firstName: "Bob",
      lastName: "Smith",
      email: "bobsmith@example.com",
      zipCode: "45678",
      booksBorrowed: 1
    },
    {
      userId: 5,
      username: "ellisjones",
      firstName: "Ellis",
      lastName: "Jones",
      email: "ellisjones@example.com",
      zipCode: "56789",
      booksBorrowed: 0
    }
  ];
  
  // Libraries Sample Data
  const libraries: Library[] = [
    {
      libraryId: 1,
      name: "Central Library",
      zipCode: "12345",
      phoneNumber: "111-222-3333",
      openingHours: { open: "12:00", close: "11:00" }
    },
    {
      libraryId: 2,
      name: "Eastside Branch",
      zipCode: "23456",
      phoneNumber: "222-333-4444",
      openingHours: { open: "09:00", close: "17:00" }
    },
    {
      libraryId: 3,
      name: "Westend Library",
      zipCode: "34567",
      phoneNumber: "333-444-5555",
      openingHours: { open: "11:00", close: "17:00" }
    },
    {
      libraryId: 4,
      name: "Southside Lib",
      zipCode: "45678",
      phoneNumber: "444-555-6666",
      openingHours: { open: "10:00", close: "16:00" }
    },
    {
      libraryId: 5,
      name: "North Town Library",
      zipCode: "56789",
      phoneNumber: "555-666-7777",
      openingHours: { open: "11:00", close: "17:00" }
    }
  ];
  
  // Books Sample Data
  const books: Book[] = [
    {
      bookId: 1,
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      isbn: "9780060935467",
      publicationDate: "1960-07-11",
      genre: Genre.Fiction
    },
    {
      bookId: 2,
      title: "1984",
      author: "George Orwell",
      isbn: "9780451524935",
      publicationDate: "1949-06-08",
      genre: Genre.Dystopian
    },
    {
      bookId: 3,
      title: "The Great Gatsby",
      author: "F. Scott Fitzgerald",
      isbn: "9780743273565",
      publicationDate: "1925-04-10",
      genre: Genre.Fiction
    },
    {
      bookId: 4,
      title: "Catcher in the Rye",
      author: "J.D. Salinger",
      isbn: "9780316769488",
      publicationDate: "1951-07-16",
      genre: Genre.Fiction
    },
    {
      bookId: 5,
      title: "Pride and Prejudice",
      author: "Jane Austen",
      isbn: "9780141439518",
      publicationDate: "1813-01-28",
      genre: Genre.Romance
    }
  ];
  
  // BookCopies Sample Data
  const bookCopies: BookCopy[] = [
    {
      copyId: 1,
      bookId: 1,
      libraryId: 1,
      status: BookStatus.Available
    },
    {
      copyId: 2,
      bookId: 1,
      libraryId: 2,
      status: BookStatus.Borrowed
    },
    {
      copyId: 3,
      bookId: 2,
      libraryId: 1,
      status: BookStatus.Available
    },
    {
      copyId: 4,
      bookId: 3,
      libraryId: 3,
      status: BookStatus.Lost
    },
    {
      copyId: 5,
      bookId: 4,
      libraryId: 4,
      status: BookStatus.Borrowed
    },
    {
      copyId: 6,
      bookId: 5,
      libraryId: 5,
      status: BookStatus.Available
    }
  ];
  
  // Borrowing Sample Data// Extended Borrowing Sample Data
const borrowings: Borrowing[] = [
    {
      borrowingId: 1,
      userId: 2,
      copyId: 2,
      borrowDate: "2023-09-01",
      returnDueDate: "2023-09-22",
      returnDate: null
    },
    {
      borrowingId: 2,
      userId: 1,
      copyId: 5,
      borrowDate: "2023-10-01",
      returnDueDate: "2023-10-22",
      returnDate: null
    },
    {
      borrowingId: 3,
      userId: 3,
      copyId: 3, // Taking an available copy of "1984" from Central Library
      borrowDate: "2023-10-05",
      returnDueDate: "2023-10-26",
      returnDate: null
    },
    {
      borrowingId: 4,
      userId: 5,
      copyId: 1, // Taking an available copy of "To Kill a Mockingbird" from Central Library
      borrowDate: "2023-10-03",
      returnDueDate: "2023-10-24",
      returnDate: null
    }
  ];

  // Define tools (functions) that the AI can use for book borrowing
const mainTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "borrowBook",
      description: "Borrow a book from a library. Don't borrow a book if it's already borrowed or damaged.",
      parameters: {
        type: "object",
        properties: {
            userId: { type: "number", description: "The ID of the user borrowing the book" },
            bookId: { type: "number", description: "The ID of the book to borrow" },
            libraryId: { type: "number", description: "The ID of the library borrowing the book from" }
        },
        required: ["userId", "bookId", "libraryId"]
      }
    }
  }
];

// Define tools (functions) that the AI can use to check the status of a book   
const checkBookTools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "checkBookStatus",
      description: "Check the status of a book. User must provide the book ID and the zip code of the library to check the status of.",
      parameters: {
        type: "object",
        properties: {
            bookId: { type: "number", description: "The ID of the book to check the status of" },
            zipCode: { type: "number", description: "The zip code of the library to check the status of" }
        },
        required: ["bookId", "zipCode"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "checkUserEligibility",
      description: "Check if a user is eligible to borrow a book and User must have no more than 1 book borrowed at a time. User's zip code must match the zip code of the library.",
      parameters: {
        type: "object",
        properties: {
            userId: { type: "number", description: "The ID of the user to check the eligibility of" },
            libraryId: { type: "number", description: "User's zip code must match the zip code of the library." }
        },
        required: ["userId", "libraryId"]
      }
    }
  },
  {
    type: "function",
    function:{
        name: "checkLibraryOpenHours",
        description: "Check if the library is open now. User must provide the library ID so we can check the open hours of the library right now.",
        parameters: {
            type: "object",
            properties: {
                libraryId: { type: "number", description: "The ID of the library to check the open hours of" }
            },
            required: ["libraryId"]
        }
    }
  },
  { 
    type: "function",
    function: {
        name: "isBookBorrowed",
        description: "Check if we were able to borrow the book after all the checks were done.",
        parameters: {
            type: "object",
            properties: {
                isBorrowed: { type: "boolean", description: "Whether the book was borrowed or not" },
                finalDecision: { type: "string", description: "The final details of the borrowing" }
            },
            required: ["isBorrowed", "finalDecision"]
        }
    }
  }
];

// Function to log messages with color
function logWithColor(message: string, color: string = YELLOW) {
  console.log(color + message + RESET);
}

// Add these helper functions at the top of the file
function logSeparator() {
  console.log("\n" + "=".repeat(50) + "\n");
}

function logStep(step: string) {
  console.log(YELLOW + step + RESET);
}

function logAIResponse(content: string | null) {
  if (content) {
    console.log(GREEN + "AI: " + RESET + content);
  }
}

function logError(error: any) {
  console.error(RED + "Error: " + error + RESET);
}

async function main() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query: string): Promise<string> => {
        return new Promise((resolve) => rl.question(query, resolve));
    };

    console.log("Welcome to the Library Management System! Type 'exit' to quit.");

    let conversationHistory: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: `You are a librarian assistant. Gather the user's ID, book ID, and library ID from the user. Once you have all this information, use the borrowBook function to borrow a book. If any information is missing, ask the user for it.`
        }
    ];

    while (true) {
        logSeparator();
        const userInput = await askQuestion("You: ");
        if (userInput.toLowerCase() === "exit") break;

        conversationHistory.push({ role: "user", content: userInput });

        try {
            logStep("Sending request to OpenAI...");
            const response = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: conversationHistory,
                tools: mainTools
            });

            const message = response.choices[0].message;
            logAIResponse(message.content);

            if (message.tool_calls) {
                for (const toolCall of message.tool_calls) {
                    const args = JSON.parse(toolCall.function.arguments);
                    logStep(`Calling ${toolCall.function.name} function...`);
                    const result= await executeFunction(toolCall.function.name, args);
                    conversationHistory.push({ 
                        role: "assistant", 
                        content: message.content, 
                        tool_calls: message.tool_calls 
                    }, 
                    { role: "function", 
                      name: toolCall.function.name, 
                      content: JSON.stringify(result) });
                }
            } else {
                conversationHistory.push(message);
            }

            // Log conversation history after each turn
            logSeparator();
            logWithColor("Conversation History:", BLUE);
            console.log(JSON.stringify(conversationHistory, null, 2));
        } catch (error) {
            logError(error);
        }
    }

    rl.close();
}

async function borrowBook(userId: number, bookId: number, libraryId: number) {
    logWithColor(`Borrowing book ${bookId} from library ${libraryId} for user ${userId}`, YELLOW);
    
    let borrowingHistory: ChatCompletionMessageParam[] = [
        {
            role: "system",
            content: `You are a borrowing the book of ${bookId} from library ${libraryId} for user ${userId}. Use the provided tools to check the status of the book, the user's eligibility, and the library's open hours. Then borrow the book if all conditions are met and modify the necessary data.`
        }
    ];

    const MAX_ITERATIONS = 3;
    let iterations = 0;
    let finalBorrowing = "";

    while (iterations < MAX_ITERATIONS) {
        logWithColor(`Iteration ${iterations + 1}/${MAX_ITERATIONS}`, YELLOW);

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: borrowingHistory,
            tools: checkBookTools,
            tool_choice: "auto"
        });

        logWithColor(`AI Response:`, YELLOW);
        console.log(response.choices[0].message);

        const message = response.choices[0].message;

        if (message.tool_calls) {
            borrowingHistory.push({ role: "assistant", content: message.content, tool_calls: message.tool_calls });

            for (const toolCall of message.tool_calls) {
                const args = JSON.parse(toolCall.function.arguments);
                const result = await executeFunction(toolCall.function.name, args);

                borrowingHistory.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result)
                });

                if (toolCall.function.name === "isBookBorrowed" && result.finalDecision) {
                    return result.finalDecision;
                }
            }
        } else {
            borrowingHistory.push(message);
        }

        iterations++;
    }
    
    return "Failed to borrow the book within the maximum number of iterations.";
}

async function executeFunction(name: string, args: any): Promise<any> {
    logWithColor(`Executing function ${name} with args:`, YELLOW);
    console.log(args);

    let result;
    switch (name) {
        case "borrowBook":
            result = await borrowBook(args.userId, args.bookId, args.libraryId);
            break;
        case "checkBookStatus":
            result = books.filter((book) => book.bookId === args.bookId);
            break;
        case "checkUserEligibility":
            result = users.filter((user) => (user.userId === args.userId) && (user.booksBorrowed === 0));
            break;
        case "checkLibraryOpenHours":
            result = libraries.filter((library) => (library.libraryId === args.libraryId) && (library.openingHours.open <= new Date().toLocaleTimeString() && library.openingHours.close >= new Date().toLocaleTimeString()));
            break;
        case "isBookBorrowed":
            result = {
                isBorrowed: args.isBorrowed, 
                finalDecision: args.finalDecision
            };
            break;
        default:
            throw new Error(`Unknown function: ${name}`);
    }

    logWithColor(`Function ${name} result:`, YELLOW);
    console.log(result);

    return result;
}

main();