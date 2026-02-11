'use client';

import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 py-8 mt-auto">
            <div className="container mx-auto px-4">
                <div className="flex flex-col items-center justify-center text-center gap-4">
                    <p className="text-gray-600 font-medium flex items-center gap-2">
                        Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> by student for students
                    </p>
                    <p className="text-gray-500 text-sm">
                        (By BTox)
                    </p>
                    <p className="text-gray-400 text-xs mt-4">
                        &copy; {new Date().getFullYear()} Lost & Found Recovery System. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
