import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Book, 
  Upload, 
  Play, 
  Pause, 
  Settings, 
  Volume2, 
  VolumeX, 
  Clock, 
  ChevronLeft, 
  Trash2,
  Type,
  FastForward,
  Timer,
  Sun,
  Moon,
  Coffee
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface BookData {
  id: string;
  name: string;
  content: string;
  lastPosition: number;
}

export default function App() {
  const [books, setBooks] = useState<BookData[]>(() => {
    const saved = localStorage.getItem('yuedu_books');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [view, setView] = useState<'library' | 'reader'>('library');

  // Persistence
  useEffect(() => {
    localStorage.setItem('yuedu_books', JSON.stringify(books));
  }, [books]);

  const currentBook = books.find(b => b.id === currentBookId);

  const handleImport = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = () => {
          const content = reader.result as string;
          const newBook: BookData = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name.replace('.txt', ''),
            content,
            lastPosition: 0
          };
          setBooks(prev => [newBook, ...prev]);
        };
        reader.readAsText(file);
      }
    });
  }, []);

  const deleteBook = (id: string) => {
    setBooks(prev => prev.filter(b => b.id !== id));
    if (currentBookId === id) setCurrentBookId(null);
  };

  const openBook = (id: string) => {
    setCurrentBookId(id);
    setView('reader');
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <AnimatePresence mode="wait">
        {view === 'library' ? (
          <LibraryView 
            key="library"
            books={books} 
            onImport={handleImport} 
            onOpen={openBook} 
            onDelete={deleteBook}
          />
        ) : (
          <ReaderView 
            key="reader"
            book={currentBook!} 
            onBack={() => setView('library')} 
            updatePosition={(pos) => {
              setBooks(prev => prev.map(b => b.id === currentBookId ? { ...b, lastPosition: pos } : b));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LibraryView({ books, onImport, onOpen, onDelete }: { 
  books: BookData[], 
  onImport: (files: File[]) => void,
  onOpen: (id: string) => void,
  onDelete: (id: string) => void,
  key?: string
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop: onImport,
    accept: { 'text/plain': ['.txt'] }
  } as any);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto p-6 pt-12"
    >
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-serif font-bold mb-2 text-primary">悦读</h1>
        <p className="text-muted-foreground italic">极简、纯粹的阅读体验</p>
      </header>

      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer mb-8",
          isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/20 hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium">点击或拖拽 TXT 文件到此处</p>
        <p className="text-sm text-muted-foreground mt-1">支持 Android & iOS 导入</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {books.map(book => (
          <Card key={book.id} className="p-4 flex items-center justify-between group hover:shadow-md transition-shadow">
            <div 
              className="flex items-center gap-4 cursor-pointer flex-1"
              onClick={() => onOpen(book.id)}
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
                <Book className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium line-clamp-1">{book.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {Math.round(book.content.length / 1000)}k 字
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
              onClick={() => onDelete(book.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </Card>
        ))}
      </div>

      {books.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p>书架空空如也，快去导入一本好书吧</p>
        </div>
      )}
    </motion.div>
  );
}

function ReaderView({ book, onBack, updatePosition }: { 
  book: BookData, 
  onBack: () => void,
  updatePosition: (pos: number) => void,
  key?: string
}) {
  const [fontSize, setFontSize] = useState(20);
  const fontSizeRef = useRef(fontSize);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number | null>(null);
  const activeIndexRef = useRef<number | null>(null);
  
  const paragraphs = useMemo(() => book.content.split(/\n+/).filter(p => p.trim().length > 0), [book.content]);

  // Keep fontSizeRef in sync
  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 to 100
  const [isReading, setIsReading] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null); // minutes
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // seconds
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const speedRef = useRef(autoScrollSpeed);
  const synth = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Keep speedRef in sync
  useEffect(() => {
    speedRef.current = autoScrollSpeed;
  }, [autoScrollSpeed]);

  // Auto Scroll Logic
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current !== null && scrollRef.current) {
      const deltaTime = time - lastTimeRef.current;
      // Use speedRef.current to ensure we always have the latest speed
      const pixelsPerSecond = speedRef.current * 2; 
      scrollRef.current.scrollTop += (pixelsPerSecond * deltaTime) / 1000;
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (autoScrollSpeed > 0) {
      if (requestRef.current === null) {
        lastTimeRef.current = null;
        requestRef.current = requestAnimationFrame(animate);
      }
    } else {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      lastTimeRef.current = null;
    }
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [autoScrollSpeed, animate]);

  // TTS Logic
  const readNextParagraph = useCallback((index: number) => {
    if (index >= paragraphs.length) {
      setIsReading(false);
      setActiveParagraphIndex(null);
      activeIndexRef.current = null;
      return;
    }

    setActiveParagraphIndex(index);
    activeIndexRef.current = index;
    
    const text = paragraphs[index];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 1.0;
    
    utterance.onend = () => {
      // Small delay between paragraphs for natural feel
      setTimeout(() => {
        if (activeIndexRef.current !== null) {
          readNextParagraph(index + 1);
        }
      }, 300);
    };

    utterance.onerror = () => {
      setIsReading(false);
      setActiveParagraphIndex(null);
      activeIndexRef.current = null;
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);

    // Scroll active paragraph into view
    const element = document.getElementById(`p-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [paragraphs, synth]);

  const toggleReading = () => {
    if (isReading) {
      synth.cancel();
      setIsReading(false);
      setActiveParagraphIndex(null);
      activeIndexRef.current = null;
    } else {
      // Find the first visible paragraph to start reading from
      let startIndex = 0;
      if (scrollRef.current) {
        const containerTop = scrollRef.current.scrollTop;
        for (let i = 0; i < paragraphs.length; i++) {
          const el = document.getElementById(`p-${i}`);
          if (el && el.offsetTop >= containerTop) {
            startIndex = i;
            break;
          }
        }
      }
      readNextParagraph(startIndex);
      setIsReading(true);
    }
  };

  // Sleep Timer Logic
  useEffect(() => {
    let interval: any;
    if (timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (timeLeft === 0) {
      synth.cancel();
      setIsReading(false);
      setAutoScrollSpeed(0);
      setTimeLeft(null);
      setSleepTimer(null);
    }
    return () => clearInterval(interval);
  }, [timeLeft, synth]);

  const startTimer = (mins: number) => {
    setSleepTimer(mins);
    setTimeLeft(mins * 60);
  };

  // Restore position
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = book.lastPosition;
    }
  }, []);

  // Save position on scroll (debounced)
  const scrollTimeoutRef = useRef<number | null>(null);
  const handleScroll = () => {
    if (scrollRef.current) {
      const pos = scrollRef.current.scrollTop;
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = window.setTimeout(() => {
        updatePosition(pos);
      }, 500);
    }
  };

  const themeConfig = {
    light: { bg: 'bg-[#fdfcf8]', text: 'text-[#1c1917]', border: 'border-[#e7e5e4]' },
    dark: { bg: 'bg-[#121212]', text: 'text-[#e0e0e0]', border: 'border-[#333333]' },
    sepia: { bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]', border: 'border-[#d3c6a8]' }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn("fixed inset-0 flex flex-col transition-colors duration-300", themeConfig[theme].bg, themeConfig[theme].text)}
    >
      {/* Header */}
      <header className={cn("h-14 border-b flex items-center justify-between px-4 backdrop-blur-md z-10 transition-colors duration-300", themeConfig[theme].bg, themeConfig[theme].border)}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} className={themeConfig[theme].text}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-medium line-clamp-1 max-w-[200px]">{book.name}</h2>
        </div>
        
        <div className="flex items-center gap-1">
          {timeLeft !== null && (
            <div className="flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-full mr-2">
              <Clock className="w-3 h-3" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
          
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" />}>
              <Settings className="w-5 h-5" />
            </SheetTrigger>
            <SheetContent className={cn(themeConfig[theme].bg, themeConfig[theme].text, themeConfig[theme].border)}>
              <SheetHeader>
                <SheetTitle className={themeConfig[theme].text}>阅读设置</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-8">
                {/* Theme Selection */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4" />
                    <span className="text-sm font-medium">阅读模式</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant={theme === 'light' ? "default" : "outline"} 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setTheme('light')}
                    >
                      <Sun className="w-4 h-4" /> 白天
                    </Button>
                    <Button 
                      variant={theme === 'dark' ? "default" : "outline"} 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setTheme('dark')}
                    >
                      <Moon className="w-4 h-4" /> 黑夜
                    </Button>
                    <Button 
                      variant={theme === 'sepia' ? "default" : "outline"} 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setTheme('sepia')}
                    >
                      <Coffee className="w-4 h-4" /> 护眼
                    </Button>
                  </div>
                </div>

                {/* Font Size */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Type className="w-4 h-4" />
                      <span className="text-sm font-medium">字体大小</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
                      >
                        -
                      </Button>
                      <span className="text-sm font-mono w-8 text-center">{fontSize}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setFontSize(prev => Math.min(40, prev + 2))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <Slider 
                    value={[fontSize]} 
                    min={12} 
                    max={40} 
                    step={1} 
                    onValueChange={(v: number[]) => setFontSize(v[0])} 
                  />
                </div>

                {/* Auto Scroll Speed */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FastForward className="w-4 h-4" />
                      <span className="text-sm font-medium">自动翻页速度</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setAutoScrollSpeed(prev => Math.max(0, prev - 5))}
                      >
                        -
                      </Button>
                      <span className="text-sm font-mono w-8 text-center">{autoScrollSpeed}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setAutoScrollSpeed(prev => Math.min(100, prev + 5))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <Slider 
                    value={[autoScrollSpeed]} 
                    min={0} 
                    max={100} 
                    step={1} 
                    onValueChange={(v: number[]) => setAutoScrollSpeed(v[0])} 
                  />
                </div>

                {/* Sleep Timer */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4" />
                    <span className="text-sm font-medium">定时停止</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[15, 30, 60].map(mins => (
                      <Button 
                        key={mins}
                        variant={sleepTimer === mins ? "default" : "outline"}
                        size="sm"
                        onClick={() => startTimer(mins)}
                      >
                        {mins} 分钟
                      </Button>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="col-span-3"
                      onClick={() => {
                        setSleepTimer(null);
                        setTimeLeft(null);
                      }}
                    >
                      取消定时
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Content */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 py-8 md:px-12 lg:px-24"
      >
        <div 
          className="max-w-2xl mx-auto font-serif leading-relaxed text-justify transition-[font-size] duration-200"
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.8' }}
        >
          {paragraphs.map((para, idx) => (
            <p 
              key={idx} 
              id={`p-${idx}`}
              className={cn(
                "mb-6 transition-all duration-300 rounded-lg px-2 -mx-2",
                activeParagraphIndex === idx 
                  ? "bg-primary/20 text-primary scale-[1.02] shadow-sm" 
                  : "opacity-100"
              )}
            >
              {para}
            </p>
          ))}
        </div>
      </div>

      {/* Footer Controls */}
      <footer className={cn("h-20 border-t flex items-center justify-center gap-8 px-6 transition-colors duration-300", themeConfig[theme].bg, themeConfig[theme].border)}>
        <Button 
          variant={autoScrollSpeed > 0 ? "default" : "outline"} 
          size="lg" 
          className="rounded-full gap-2"
          onClick={() => setAutoScrollSpeed(prev => prev > 0 ? 0 : 20)}
        >
          {autoScrollSpeed > 0 ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          {autoScrollSpeed > 0 ? "停止翻页" : "自动翻页"}
        </Button>

        <Button 
          variant={isReading ? "default" : "outline"} 
          size="lg" 
          className="rounded-full gap-2"
          onClick={toggleReading}
        >
          {isReading ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          {isReading ? "停止朗读" : "有声朗读"}
        </Button>
      </footer>
    </motion.div>
  );
}
