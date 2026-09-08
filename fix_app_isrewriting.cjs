const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !selectedEntry) return;
    
    // Trigger Ink Bleed Animation
    setBurningMessages(prev => [...prev, messageIndex]);`;

const newStr = `  const removeMessage = async (entryId: string, messageIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !selectedEntry || isRewritingMemory) return;
    
    setIsRewritingMemory(true);
    // Trigger Ink Bleed Animation
    setBurningMessages(prev => [...prev, messageIndex]);`;

code = code.replace(targetStr, newStr);

const endStr = `              return entry;
            })
          );
        } catch (error: any) {
          console.error("Omit failed:", error);
        }
      })();
    }, 1000);
  };`;

const newEndStr = `              return entry;
            })
          );
        } catch (error: any) {
          console.error("Omit failed:", error);
        } finally {
          setIsRewritingMemory(false);
        }
      })();
    }, 1000);
  };`;

code = code.replace(endStr, newEndStr);

fs.writeFileSync('src/App.tsx', code);
console.log("Fixed isRewritingMemory tracking");
