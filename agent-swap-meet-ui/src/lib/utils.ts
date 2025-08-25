// src/lib/utils.ts

/**
 * Converts an IPFS URI (e.g., "ipfs://Qm...") to a public HTTP gateway URL.
 * This allows browsers to display images and fetch metadata from IPFS.
 * @param ipfsUri The IPFS URI to convert.
 * @returns A full HTTPS URL pointing to the ipfs.io public gateway.
 */
export const ipfsToGateway = (ipfsUri?: string): string => {
    // If the URI is missing, invalid, or already a full URL, return a placeholder or the URL itself.
    if (!ipfsUri || !ipfsUri.startsWith('ipfs://')) {
        // You can return a default placeholder image URL here if you want.
        // For now, we'll return an empty string and let the calling component handle it.
        return ipfsUri || ''; 
    }

    // Remove the "ipfs://" prefix to get the Content Identifier (CID).
    const cid = ipfsUri.substring(7);

    // Use a reliable public gateway. ipfs.io is a common choice.
    return `https://ipfs.io/ipfs/${cid}`;
};