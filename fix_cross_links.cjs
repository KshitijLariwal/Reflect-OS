const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add severedLinks state
code = code.replace(
  'const [deletingIds, setDeletingIds] = useState<string[]>([]);',
  'const [deletingIds, setDeletingIds] = useState<string[]>([]);\n  const [severedLinks, setSeveredLinks] = useState<{ [id: string]: string[] }>({});'
);

// We need to inject the cross-linking UI inside the map over archivesData.
const searchStr = `                      {entry.tags?.map((tag: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-[#143026]/10 rounded-md text-[9px] lg:text-[10px] uppercase tracking-widest text-[#143026]/80 font-sans">
                          {tag}
                        </span>
                      ))}
                    </div>`;

const crossLinkingLogic = `
                    </div>
                    {(() => {
                      const relatedEntries = archivesData.filter(other => 
                        other.id !== entry.id && 
                        other.tags?.some((tag: string) => entry.tags?.includes(tag)) &&
                        !(severedLinks[entry.id] || []).includes(other.id) &&
                        !(severedLinks[other.id] || []).includes(entry.id)
                      ).slice(0, 2);
                      
                      if (relatedEntries.length === 0) return null;
                      return (
                        <div className="mt-4 pt-3 border-t border-[#143026]/10 flex flex-col gap-2">
                          <p className="text-[10px] text-[#143026]/60 uppercase tracking-widest font-sans flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                            Ephemeral Threads
                          </p>
                          {relatedEntries.map(rel => (
                            <div key={rel.id} className="group/thread flex items-center justify-between px-2 py-1 rounded bg-[#d9a05b]/5 border border-[#d9a05b]/10 hover:border-[#d9a05b]/40 transition-all cursor-crosshair">
                              <span className="text-xs font-serif text-[#143026]/80 truncate max-w-[80%]">{rel.title}</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSeveredLinks(prev => ({
                                    ...prev,
                                    [entry.id]: [...(prev[entry.id] || []), rel.id]
                                  }));
                                }}
                                className="text-[#7a3e3e]/40 hover:text-[#7a3e3e] hover:bg-[#7a3e3e]/10 p-0.5 rounded opacity-0 group-hover/thread:opacity-100 transition-opacity"
                                title="Sever Thread"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}`;

if (code.includes('                      {entry.tags?.map((tag: string, i: number) => (')) {
  code = code.replace(searchStr, crossLinkingLogic);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Added Cross Linking to archive mapping");
} else {
  console.log("Search string not found!");
}
