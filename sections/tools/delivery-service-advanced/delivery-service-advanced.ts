import dotenv from "dotenv";
import OpenAI from "openai";
import * as readline from "readline";
import { db } from "../../../db";
import { deliveryTable } from "../../../db/schema/delivery-schema";
import { eq } from "drizzle-orm";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources";

dotenv.config({ path: ".env.local" });

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const GREEN = "\x1b[32m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

async function getDeliveryFromDB(orderId: string) {
    return await db.query.delivery.findFirst({
        where: eq(deliveryTable.orderId, orderId)
    });
}

async function getAllDeliveriesFromDB() {
    return await db.query.delivery.findMany();
}

async function updateDeliveryInDB(orderId: string, updates: Partial<typeof deliveryTable.$inferInsert>) {
    await db.update(deliveryTable).set(updates).where(eq(deliveryTable.orderId, orderId));
    return await getDeliveryFromDB(orderId);
}

async function rejectDeliveryInDB(orderId: string, reason: string) {
    await db.update(deliveryTable).set({ isRejected: true, rejectedReason: reason }).where(eq(deliveryTable.orderId, orderId));
    return await getDeliveryFromDB(orderId);
}

async function main() {
    let conversationHistory: ChatCompletionMessageParam[] = [];

    const deliveryServiceTools: ChatCompletionTool[] = [
        {
            type: "function",
            function: {
                name: "getDelivery",
                description: "Gets the delivery information for a given order ID.",
                parameters: {
                    type: "object",
                    properties: {
                        orderId: {
                            type: "string",
                            description: "The order ID of the delivery."
                        }
                    },
                    required: ["orderId"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "getAllDeliveries",
                description: "Gets the delivery information for all deliveries."
            }
        },
        {
            type: "function",
            function: {
                name: "updateDelivery",
                description: "Updates the delivery information for a given order ID. At least one field (besides orderId) must be provided.",
                parameters: {
                    type: "object",
                    properties: {
                        orderId: {
                            type: "string",
                            description: "The order ID of the delivery."
                        },
                        deliveryStatus: {
                            type: "string",
                            description: "The new status of the delivery."
                        },
                        isRejected: {
                            type: "boolean",
                            description: "Whether the delivery has been rejected."
                        },
                        rejectedReason: {
                            type: "string",
                            description: "The reason for rejecting the delivery."
                        }
                    },
                    required: ["orderId"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "rejectDelivery",
                description: "Rejects the delivery for a given order ID.",
                parameters: {
                    type: "object",
                    properties: {
                        orderId: {
                            type: "string",
                            description: "The order ID of the delivery."
                        },
                        rejectedReason: {
                            type: "string",
                            description: "The reason for rejecting the delivery. This is required if isRejected is true. Don't accept rejection without a reason."
                        }
                    },
                    required: ["orderId", "reason"]
                }
            }
        }
    ];

    const tools = [...deliveryServiceTools];

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const askQuestion = (query: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(query, (answer) => {
                resolve(answer);
            });
        });
    };

    while (true) {
        const userInput = await askQuestion("You: ");
        if (userInput.toLowerCase() === "exit") break;

        conversationHistory.push({ role: "user", content: userInput });

        const response = await openai.chat.completions.create({
            //model: "gpt-4o-mini",
            model: "gpt-4o",
            messages: conversationHistory,
            tools: tools,
            tool_choice: "auto"
        });

        const message = response.choices[0].message;

        if (message.tool_calls) {
            conversationHistory.push(message);

            const toolCallPromises = message.tool_calls.map(async (toolCall) => {
                console.log(BLUE + `\nCalling function: ${toolCall.function.name}` + RESET);
                const args = JSON.parse(toolCall.function.arguments);

                if (toolCall.function.name === "getDelivery") {
                    console.log(GREEN + `\nGetting delivery info for: ${args.orderId}` + RESET);
                    const delivery = await getDeliveryFromDB(args.orderId);
                    const result = delivery ? JSON.stringify(delivery) : "Delivery not found.";
                    console.log(GREEN + "Delivery data:" + RESET);
                    console.log(GREEN + result + "\n" + RESET);
                    
                    return {
                        role: "tool",
                        content: result,
                        tool_call_id: toolCall.id
                    } as ChatCompletionMessageParam;
                }
                else if (toolCall.function.name === "updateDelivery") { 
                    console.log(GREEN + `\nUpdating delivery info for: ${args.orderId}` + RESET);
                    const updates: Partial<typeof deliveryTable.$inferInsert> = {};
                    if (args.deliveryStatus) updates.deliveryStatus = args.deliveryStatus;
                    if (args.isRejected !== undefined) updates.isRejected = args.isRejected;
                    if (args.rejectedReason) updates.rejectedReason = args.rejectedReason;
                    
                    const updatedDelivery = await updateDeliveryInDB(args.orderId, updates);
                    const result = updatedDelivery ? `Delivery updated successfully.` : "Delivery not found.";
                    console.log(GREEN + result + "\n" + RESET);
                    
                    return {
                        role: "tool",
                        content: result,
                        tool_call_id: toolCall.id
                    } as ChatCompletionMessageParam;
                }
                else if (toolCall.function.name === "rejectDelivery") { 
                    console.log(GREEN + `\nRejecting delivery for: ${args.orderId}` + RESET);
                    const rejected = await rejectDeliveryInDB(args.orderId, args.rejectedReason);
                    const result = rejected ? `Delivery rejected successfully.` : "Delivery not found.";
                    console.log(GREEN + result + "\n" + RESET);
                    
                    return {
                        role: "tool",
                        content: result,
                        tool_call_id: toolCall.id
                    } as ChatCompletionMessageParam;
                }
                else if (toolCall.function.name === "getAllDeliveries") {
                    console.log(GREEN + `\nGetting all deliveries` + RESET);
                    const deliveries = await getAllDeliveriesFromDB();
                    const result = deliveries ? JSON.stringify(deliveries) : "No deliveries found.";
                    console.log(GREEN + "All deliveries:" + RESET);

                    return {
                        role: "tool",
                        content: result,
                        tool_call_id: toolCall.id
                    } as ChatCompletionMessageParam;
                }
            });   

            const toolCallResults = await Promise.all(toolCallPromises);
            conversationHistory.push(...toolCallResults.filter(Boolean));

            const finalResponse = await openai.chat.completions.create({
                //model: "gpt-4o-mini",
                model: "gpt-4o",
                messages: conversationHistory
            });

            const finalMessage = finalResponse.choices[0].message;
            if (finalMessage.content) {
                console.log("AI:", finalMessage.content);
                conversationHistory.push({ role: "assistant", content: finalMessage.content });
            }
        } else if (message.content) {
            console.log("AI:", message.content);
            conversationHistory.push({ role: "assistant", content: message.content });
        }
    }

    rl.close();
}

main();