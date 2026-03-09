'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/useAppStore';
import { HOBBIES } from '@/lib/hobbies';
import { Search, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HobbyPicker() {
    const { config, setHobbies, clearHobbies } = useAppStore();
    const [search, setSearch] = useState('');

    const selectedHobbies = config.hobbies || [];

    const filteredHobbies = HOBBIES.filter((h) =>
        h.toLowerCase().includes(search.toLowerCase())
    );

    const toggleHobby = (hobby: string) => {
        if (selectedHobbies.includes(hobby)) {
            setHobbies(selectedHobbies.filter((h) => h !== hobby));
        } else {
            setHobbies([...selectedHobbies, hobby]);
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Clear */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search hobbies..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                </div>
                {selectedHobbies.length > 0 && (
                    <button
                        onClick={clearHobbies}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors flex items-center gap-1.5"
                    >
                        <X className="w-3 h-3" /> Clear ({selectedHobbies.length})
                    </button>
                )}
            </div>

            {/* Hobby Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredHobbies.map((hobby) => {
                    const isSelected = selectedHobbies.includes(hobby);
                    return (
                        <button
                            key={hobby}
                            onClick={() => toggleHobby(hobby)}
                            className={cn(
                                'flex items-center justify-between px-3 py-2 rounded-xl border-2 text-xs font-medium transition-all text-left',
                                isSelected
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                                    : 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-violet-300'
                            )}
                        >
                            <span className="truncate">{hobby}</span>
                            {isSelected && <Check className="w-3 h-3 flex-shrink-0 ml-1" />}
                        </button>
                    );
                })}
            </div>

            {filteredHobbies.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs italic">
                    No hobbies found matching "{search}"
                </div>
            )}

            {/* Tip */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
                <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                    💡 <strong>Pro Tip:</strong> Select a hobby to create a niche-specific mockup.
                    Perfect for combining themes like "Halloween + Fishing" or "Christmas + Yoga".
                </p>
            </div>
        </div>
    );
}
