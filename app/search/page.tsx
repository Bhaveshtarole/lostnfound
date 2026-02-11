'use client';

import { Search as SearchIcon, Filter, AlertCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { searchItems } from '@/app/actions/item';
import Link from 'next/link';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setHasSearched(true);

        try {
            const items = await searchItems(query);
            setResults(items);
        } catch (error) {
            console.error(error);
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-800 mb-4">Search Lost & Found</h1>
                    <div className="relative max-w-xl mx-auto">
                        <form onSubmit={handleSearch} className="relative">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search for items (e.g., 'keys', 'wallet', 'iphone')..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-full border border-gray-200 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-lg transition-all"
                            />
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="absolute right-2 top-2 bg-blue-600 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                            </button>
                        </form>
                    </div>
                </div>

                {hasSearched && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                            <h2 className="text-xl font-semibold text-gray-800">Results ({results.length})</h2>
                            <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
                                <Filter className="w-4 h-4" /> Filter
                            </button>
                        </div>

                        {results.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {results.map((result) => (
                                    <div key={result.id} className="card-premium p-6 bg-white flex items-center justify-between group hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full overflow-hidden shrink-0 ${result.type === 'Found' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                {result.image ? (
                                                    <img src={result.image.startsWith('http') ? result.image : `/uploads/${result.image}`} alt={result.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center ${result.type === 'Found' ? 'text-green-600' : 'text-red-600'}`}>
                                                        {result.type === 'Found' ? '✓' : '!'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{result.name}</h3>
                                                <p className="text-sm text-gray-500">
                                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mr-2 ${result.type === 'Found' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {result.type}
                                                    </span>
                                                    {result.date} • {result.location}
                                                </p>
                                            </div>
                                        </div>
                                        <Link href={`/item/${result.id}`} className="btn-primary text-sm whitespace-nowrap">
                                            View Details
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="bg-white w-16 h-16 rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-800 mb-1">No results found</h3>
                                <p className="text-gray-500">Try adjusting your search terms or filters.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
