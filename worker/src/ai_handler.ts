// worker/src/ai_handler.ts
import * as dotenv from "dotenv";
dotenv.config();

import pinatasdk from "@pinata/sdk";
import axios from "axios";
import { Readable } from "stream";
import { Job } from "./types";

const pinata = new pinatasdk({ pinataJWTKey: process.env.PINATA_JWT! });
const HF_API_TOKEN = process.env.HF_API_TOKEN!;

// The main function for the entire AI + IPFS pipeline
export async function generateAndUploadArt(job: Job, traits: any[]): Promise<string> {
    // 1. Engineer the AI Prompt
    const traitString = traits.map(t => `${t.value} ${t.trait_type}`).join(', ');
    
    let prompt: string;
    if (traitString) {
        prompt = `epic digital painting of a character with the following features: ${traitString}, fantasy art, vibrant colors, detailed, cinematic lighting, artstation`;
    } else {
        prompt = `A beautiful, epic digital painting of a magical alchemist's creation, fantasy art, vibrant colors, detailed, cinematic lighting, artstation`;
    }
    console.log(`[AI] Generated Prompt: ${prompt}`);

    // 2. Call Hugging Face with the CORRECT headers
    console.log("[AI] Calling Hugging Face with Stable Diffusion...");
    const modelEndpoint = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0";
    
    try {
        const imageResponse = await axios.post(
            modelEndpoint,
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${HF_API_TOKEN}`,
                    // --- THIS IS THE FINAL FIX ---
                    // We explicitly tell the server we accept an image as the response
                    Accept: 'image/png'
                },
                responseType: 'arraybuffer',
            }
        );

        const imageBuffer = Buffer.from(imageResponse.data, "binary");
        const imageStream = Readable.from(imageBuffer);
        console.log("[AI] Image generated successfully!");

        // 3. Upload image to Pinata (IPFS)
        const imageUploadResult = await pinata.pinFileToIPFS(imageStream, {
            pinataMetadata: { name: `Alchemist Creation #${job.job_id}` }
        });
        const imageIpfsUri = `ipfs://${imageUploadResult.IpfsHash}`;
        console.log(`[IPFS] Image uploaded to: ${imageIpfsUri}`);

        // 4. Create and upload metadata
        const newNftMetadata = {
            name: `Alchemist Creation #${job.job_id}`,
            description: `A unique artwork transmuted by the Alchemist Agent from parent NFT ${job.parent_nft_token_id}.`,
            image: imageIpfsUri,
            attributes: [
                { trait_type: "Parent Contract", value: job.parent_nft_address },
                { trait_type: "Parent Token ID", value: job.parent_nft_token_id },
                { trait_type: "Alchemist Agent ID", value: job.agent_token_id },
                ...traits
            ],
        };

        const metadataUploadResult = await pinata.pinJSONToIPFS(newNftMetadata, {
            pinataMetadata: { name: `Alchemist Creation Metadata #${job.job_id}` }
        });
        const metadataIpfsUri = `ipfs://${metadataUploadResult.IpfsHash}`;
        console.log(`[IPFS] Metadata uploaded to: ${metadataIpfsUri}`);

        return metadataIpfsUri;

    } catch (error: any) {
        console.error("[AI] Hugging Face API call failed.");
        if (error.response) {
            // Try to decode the error response if it's a buffer
            try {
                const errorMessage = JSON.parse(Buffer.from(error.response.data).toString());
                console.error("[AI] Error Details:", errorMessage);
            } catch (e) {
                console.error("[AI] Could not parse error response:", error.message);
            }
        }
        throw error; // Stop the job
    }
}