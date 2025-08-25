// src/components/Footer.tsx
import { Github } from "lucide-react";

export const Footer = () => {
    return (
        <footer className="w-full mt-12 py-8 border-t border-gray-700">
            <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
                <p>The Alchemist's Ledger - A Decentralized AI Agent Platform on Sei.</p>
                <p className="mt-2">This is a demo project for the MCPU Bounty and is running on the Arctic-1 Devnet.</p>
                <a 
                    href="https://github.com/your-username/your-repo" // <-- UPDATE THIS LINK
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mt-4 inline-flex items-center gap-2 hover:text-white"
                >
                    <Github size={16} />
                    View on GitHub
                </a>
            </div>
        </footer>
    );
};