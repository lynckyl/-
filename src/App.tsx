import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import jschardet from 'jschardet';
import { saveBookContent, getBookContent, deleteBookContent } from './lib/db';
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
  Coffee,
  List,
  Search,
  Filter,
  SortAsc,
  Tag as TagIcon,
  Plus,
  X,
  MoreVertical,
  User,
  Calendar,
  GripVertical,
  Cloud,
  Globe,
  Loader2,
  FolderOpen,
  Smartphone,
  Share2,
  Copy,
  Highlighter,
  Check
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
  SheetTrigger,
  SheetClose 
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

const DEFAULT_MANUAL_TXT = `第一章：极简电子书《悦读》操作说明

欢迎使用《悦读》！这是一款为您量身定制的极简、纯粹且功能齐备的经典文本阅读工具。

在这里，我们特别为您配置了如下纯享体验：
1. 【高质听书（有声朗读）】：点击下方工具栏的“朗读”，能够直接驱动系统级高质量语音为您有声悦读，支持调节语速、声调，并自带自动划词跟读轨迹！
2. 【段落快捷操作】：点击本行或任何您喜欢、关注的段落，均可在页面下边缘弹起极简“段落微工具”，允许您对单独的一段进行“荧光笔着色高亮”、“复制这行文字”或者直接跳转“由此朗读”！
3. 【自适应滚动/自动翻页】：解放双手的神器！一键设定无级滚动或整页等待时间，由我们贴心的缓降动画为您温柔推送接下来的行文！
4. 【睡眠倒计时】：担心看书看听书不知不觉睡着？点击最下方时钟标志启动 15/30/45/60 分钟等定时。到点后，我们将无声渐变关闭 TTS 和轻缓下沉页面，体贴守护。

第二章：现代抒情名篇之一・背影

作者：朱自清

我与父亲不相见已二年余了，我最不能忘记的是他的背影。那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行。我从北京到徐州，打算跟着父亲奔丧回家。到徐州见着父亲，看见满院狼藉的东西，又想起祖母，不禁簌簌地流下眼泪。父亲说：“事已至此，不必难过，好在天无绝人之路！”

回家变卖典质，父亲还了亏空；又借钱办了丧事。这些日子，家中光景很是惨淡，一半为了丧事，一半为了父亲赋闲。丧事完毕，父亲要到南京谋事，我也要回北京念书，我们便同行。

到南京时，有朋友约去游逛，勾留了一日；第二日上午便须渡江到浦口，下午上车北去。父亲因为事忙，本已说定不送我，叫旅馆里一个熟识的茶房陪我同去。他再三嘱咐茶房，甚是仔细。但他终于不放心，怕茶房不妥帖；颇踌躇了一会。其实我那年已二十岁，北京已来往过两三次，是没有什么要紧的了。他踌躇了一会，终于决定还是自己送我去。我再三劝他不必去；他只说：“不要紧，他们去不好！”

第三章：经典古诗漫步

【江城子】・苏轼
十年生死两茫茫，不思量，自难忘。
千里孤坟，无处话凄凉。
纵使相逢应不识，尘满面，鬓如霜。
夜来幽梦忽还乡，小轩窗，正梳妆。
相顾无言，惟有泪千行。
料得年年肠断处，明月夜，短松冈。

【念奴娇・赤壁怀古】・苏轼
大江东去，浪淘尽，千古风流人物。
故垒西边，人道是，三国周郎壁。
乱石穿空，惊涛拍岸，卷起千堆雪。
江山如画，一时多少豪杰。
遥想公瑾当年，小乔初嫁了，雄姿英发。
羽扇纶巾，谈笑间，樯橹灰飞烟灭。
故国神游，多情应笑我，早生华发。
人生如梦，一尊还鈹江月。`;

interface BookData {
  id: string;
  name: string;
  author?: string;
  tags: string[];
  importTime: number;
  contentSize: number;
  lastPosition: number;
  lastParagraphIndex: number;
}

type SortField = 'name' | 'author' | 'importTime';

export default function App() {
  const [books, setBooks] = useState<BookData[]>(() => {
    try {
      const saved = localStorage.getItem('yuedu_books');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((b: any) => ({
            ...b,
            tags: b.tags || [],
            importTime: b.importTime || Date.now(),
            author: b.author || '',
            lastPosition: b.lastPosition || 0,
            lastParagraphIndex: b.lastParagraphIndex || 0
          }));
        }
      }
      
      // Inject sample book on empty load
      const sampleBookId = 'sample-book-yuedu';
      return [{
        id: sampleBookId,
        name: '《悦读》简明手册与古今佳作',
        author: '悦读工作室',
        tags: ['经典', '新手指南', '预装'],
        importTime: Date.now(),
        contentSize: DEFAULT_MANUAL_TXT.length,
        lastPosition: 0,
        lastParagraphIndex: 0
      }];
    } catch (e) {
      console.error("Failed to load books from localStorage:", e);
      return [];
    }
  });
  const [currentBookId, setCurrentBookId] = useState<string | null>(null);
  const [view, setView] = useState<'library' | 'reader'>('library');

  // Persistence and Default Book DB Seed
  useEffect(() => {
    localStorage.setItem('yuedu_books', JSON.stringify(books));
  }, [books]);

  useEffect(() => {
    const seedDefaultBook = async () => {
      try {
        const existing = await getBookContent('sample-book-yuedu');
        if (!existing) {
          await saveBookContent('sample-book-yuedu', DEFAULT_MANUAL_TXT);
        }
      } catch (err) {
        console.error("Failed to seed default book content in IndexedDB:", err);
      }
    };
    seedDefaultBook();
  }, []);

  const currentBook = books.find(b => b.id === currentBookId);

  const handleImport = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach(file => {
      if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
        const reader = new FileReader();
        reader.onload = async () => {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Detect encoding
          // Convert a small chunk to string for detection
          const binaryString = Array.from(uint8Array.slice(0, 10000))
            .map(b => String.fromCharCode(b))
            .join('');
          const detection = jschardet.detect(binaryString);
          const encoding = detection.encoding || 'utf-8';
          
          try {
            const decoder = new TextDecoder(encoding);
            const content = decoder.decode(uint8Array);
            const id = Math.random().toString(36).substr(2, 9);
            
            // Save content to IndexedDB
            await saveBookContent(id, content);
            
            const newBook: BookData = {
              id,
              name: file.name.replace('.txt', ''),
              author: '',
              tags: [],
              importTime: Date.now(),
              contentSize: content.length,
              lastPosition: 0,
              lastParagraphIndex: 0
            };
            setBooks(prev => [newBook, ...prev]);
          } catch (error) {
            console.error('Decoding failed:', error);
            // Fallback to UTF-8 if detection fails
            const decoder = new TextDecoder('utf-8');
            const content = decoder.decode(uint8Array);
            const id = Math.random().toString(36).substr(2, 9);
            await saveBookContent(id, content);
            const newBook: BookData = {
              id,
              name: file.name.replace('.txt', ''),
              author: '',
              tags: [],
              importTime: Date.now(),
              contentSize: content.length,
              lastPosition: 0,
              lastParagraphIndex: 0
            };
            setBooks(prev => [newBook, ...prev]);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    });
  }, []);

  const deleteBook = async (id: string) => {
    await deleteBookContent(id);
    setBooks(prev => prev.filter(b => b.id !== id));
    if (currentBookId === id) setCurrentBookId(null);
  };

  const openBook = (id: string) => {
    setCurrentBookId(id);
    setView('reader');
  };

  const updateBookMetadata = (id: string, metadata: Partial<Pick<BookData, 'author' | 'tags' | 'name'>>) => {
    setBooks(prev => prev.map(b => b.id === id ? { ...b, ...metadata } : b));
  };

  const addBookManually = async (name: string, content: string) => {
    const id = Date.now().toString();
    await saveBookContent(id, content);
    const newBook: BookData = {
      id,
      name: name.endsWith('.txt') ? name : `${name}.txt`,
      author: '',
      tags: [],
      importTime: Date.now(),
      contentSize: content.length,
      lastPosition: 0,
      lastParagraphIndex: 0
    };
    setBooks(prev => [newBook, ...prev]);
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
            onUpdateMetadata={updateBookMetadata}
            onAddBook={addBookManually}
          />
        ) : (
          <ReaderView 
            key={`reader-${currentBookId}`}
            book={currentBook!} 
            onBack={() => setView('library')} 
            updateProgress={(pos, paraIdx) => {
              setBooks(prev => prev.map(b => b.id === currentBookId ? { ...b, lastPosition: pos, lastParagraphIndex: paraIdx } : b));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function LibraryView({ books, onImport, onOpen, onDelete, onUpdateMetadata, onAddBook }: { 
  books: BookData[], 
  onImport: (files: File[]) => void,
  onOpen: (id: string) => void,
  onDelete: (id: string) => void,
  onUpdateMetadata: (id: string, metadata: Partial<BookData>) => void,
  onAddBook: (name: string, content: string) => void,
  key?: string
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('importTime');
  const [editingBook, setEditingBook] = useState<BookData | null>(null);
  const [isCloudImportOpen, setIsCloudImportOpen] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop: onImport,
    accept: { 'text/plain': ['.txt'] }
  } as any);

  const triggerNativeImport = () => {
    const input = document.getElementById('native-file-input');
    if (input) input.click();
  };

  const sortLabels: Record<SortField, string> = {
    importTime: '最近导入',
    name: '书名排序',
    author: '作者排序'
  };

  const filteredAndSortedBooks = useMemo(() => {
    return books
      .filter(book => {
        const query = searchQuery.toLowerCase();
        return (
          book.name.toLowerCase().includes(query) ||
          (book.author || '').toLowerCase().includes(query) ||
          (book.tags || []).some(tag => tag.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        if (sortField === 'name') return a.name.localeCompare(b.name);
        if (sortField === 'author') return (a.author || '').localeCompare(b.author || '');
        if (sortField === 'importTime') return b.importTime - a.importTime;
        return 0;
      });
  }, [books, searchQuery, sortField]);

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

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="搜索书名、作者或标签..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-[160px]">
              <SortAsc className="w-4 h-4 mr-2" />
              <SelectValue>{sortLabels[sortField]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="importTime">最近导入</SelectItem>
              <SelectItem value="name">书名排序</SelectItem>
              <SelectItem value="author">作者排序</SelectItem>
            </SelectContent>
          </Select>
          <div {...getRootProps()}>
            <input {...getInputProps()} id="native-file-input" />
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" /> 导入
            </Button>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setIsCloudImportOpen(true)}>
            <Cloud className="w-4 h-4" /> 网盘导入
          </Button>
        </div>
      </div>

      {books.length > 0 && filteredAndSortedBooks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>未找到匹配的书籍</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredAndSortedBooks.map(book => (
          <Card key={book.id} className="p-4 flex flex-col group hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="flex items-start justify-between mb-2">
              <div 
                className="flex items-center gap-4 cursor-pointer flex-1"
                onClick={() => onOpen(book.id)}
              >
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground shrink-0">
                  <Book className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium line-clamp-1">{book.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {book.author && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> {book.author}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(book.importTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditingBook(book)}>
                    编辑信息
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(book.id)}>
                    删除书籍
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap gap-1 mt-auto pt-2">
              {(book.tags || []).map(tag => (
                <Badge key={tag} variant="secondary" className="text-[10px] py-0 px-2 font-normal">
                  {tag}
                </Badge>
              ))}
              <p className="text-[10px] text-muted-foreground ml-auto">
                {Math.round(book.contentSize / 1000)}k 字
              </p>
            </div>
          </Card>
        ))}
      </div>

      {books.length === 0 && (
        <div 
          {...getRootProps()} 
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer",
            isDragActive ? "border-primary bg-primary/5 scale-[1.02]" : "border-muted-foreground/20 hover:border-primary/50"
          )}
        >
          <input {...getInputProps()} id="native-file-input" />
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium">点击或拖拽 TXT 文件到此处</p>
          <p className="text-sm text-muted-foreground mt-1 text-balance">目前您的书架还是空的，快去导入一本好书吧</p>
        </div>
      )}

      {editingBook && (
        <EditBookDialog 
          book={editingBook} 
          onClose={() => setEditingBook(null)} 
          onSave={(metadata) => {
            onUpdateMetadata(editingBook.id, metadata);
            setEditingBook(null);
          }} 
        />
      )}

      {isCloudImportOpen && (
        <CloudImportDialog 
          onClose={() => setIsCloudImportOpen(false)}
          onImport={onAddBook}
          onNativeImport={triggerNativeImport}
        />
      )}

      <footer className="mt-16 pb-8 text-center">
        <p className="text-xs text-muted-foreground font-mono">v1.0.1</p>
      </footer>
    </motion.div>
  );
}

function CloudImportDialog({ onClose, onImport, onNativeImport }: { 
  onClose: () => void, 
  onImport: (name: string, content: string) => void,
  onNativeImport: () => void
}) {
  const [mode, setMode] = useState<'url' | 'webdav' | 'native'>('url');
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // WebDAV browsing state
  const [webdavPath, setWebdavPath] = useState('/');
  const [directoryItems, setDirectoryItems] = useState<any[]>([]);
  const [isBrowsing, setIsBrowsing] = useState(false);

  const decodeBuffer = async (buffer: ArrayBuffer): Promise<string> => {
    const uint8Array = new Uint8Array(buffer);
    const result = jschardet.detect(uint8Array as any);
    const encoding = result.encoding || 'UTF-8';
    return new TextDecoder(encoding).decode(buffer);
  };

  const handleUrlImport = async () => {
    if (!url) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/cloud/fetch?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('下载失败');
      const buffer = await response.arrayBuffer();
      const content = await decodeBuffer(buffer);
      const filename = url.split('/').pop()?.split('?')[0] || '未命名书籍';
      onImport(filename, content);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWebDavList = async (path: string = '/') => {
    setIsBrowsing(true);
    setError(null);
    try {
      const resp = await fetch('/api/cloud/webdav/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, username, password, path })
      });
      if (!resp.ok) throw new Error('连接失败');
      const data = await resp.json();
      setDirectoryItems(Array.isArray(data) ? data : []);
      setWebdavPath(path);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleWebDavImportItem = async (item: any) => {
    if (item.type === 'directory') {
      handleWebDavList(item.filename);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/cloud/webdav/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, username, password, filePath: item.filename })
      });
      if (!resp.ok) throw new Error('下载失败');
      const buffer = await resp.arrayBuffer();
      const content = await decodeBuffer(buffer);
      onImport(item.basename, content);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportAllFromFolder = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let count = 0;
      for (const item of directoryItems) {
        if (item.type === 'file' && (item.basename.endsWith('.txt') || item.basename.endsWith('.TXT'))) {
          const resp = await fetch('/api/cloud/webdav/fetch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, username, password, filePath: item.filename })
          });
          if (resp.ok) {
            const buffer = await resp.arrayBuffer();
            const content = await decodeBuffer(buffer);
            onImport(item.basename, content);
            count++;
          }
        }
      }
      if (count === 0) setError('未在当前文件夹找到 .txt 文件');
      else onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-4" /> 网盘/系统联动导入
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="url">直链导入</TabsTrigger>
            <TabsTrigger value="webdav">WebDAV</TabsTrigger>
            <TabsTrigger value="native">手机系统集成</TabsTrigger>
          </TabsList>
          
          <div className="mt-6 space-y-4 min-h-[300px]">
            {mode === 'url' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">文件链接 (URL)</label>
                  <Input 
                    placeholder="请输入书籍下载直链 (支持 .txt)" 
                    value={url} 
                    onChange={e => setUrl(e.target.value)}
                  />
                  <p className="text-[10px] text-muted-foreground">提示：您可以从公网直接获取 TXT 文件的链接进行导入。</p>
                </div>
                <Button className="w-full" disabled={isLoading || !url} onClick={handleUrlImport}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
                  立即导入
                </Button>
              </div>
            ) : mode === 'webdav' ? (
              <div className="space-y-4">
                {!directoryItems.length ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">WebDAV 服务地址</label>
                      <Input placeholder="https://example.com/dav" value={url} onChange={e => setUrl(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">用户名</label>
                        <Input value={username} onChange={e => setUsername(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">密码</label>
                        <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => handleWebDavList('/')} disabled={isBrowsing || !url}>
                      {isBrowsing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "连接并浏览"}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      提示：您可以使用 Alist 等工具将阿里云盘、百度网盘等挂载为 WebDAV 服务。
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-secondary/50 p-2 rounded-lg sticky top-0 z-10">
                      <div className="flex items-center gap-2 text-xs truncate max-w-[70%]">
                        <FolderOpen className="w-3 h-3 shrink-0" />
                        <span className="truncate">{webdavPath}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => handleWebDavList('/')}>回到根目录</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={handleImportAllFromFolder}>一键导入本页全部 TXT</Button>
                      </div>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2 custom-scrollbar border rounded-lg p-2">
                      {webdavPath !== '/' && (
                        <div 
                          className="flex items-center gap-3 p-2 hover:bg-secondary cursor-pointer rounded text-sm opacity-60"
                          onClick={() => handleWebDavList(webdavPath.split('/').slice(0, -1).join('/') || '/')}
                        >
                          <ChevronLeft className="w-4 h-4" /> ..上级目录
                        </div>
                      )}
                      {directoryItems.map((item, idx) => (
                        <div 
                          key={idx}
                          className="flex items-center gap-3 p-2 hover:bg-secondary cursor-pointer rounded text-sm group"
                          onClick={() => handleWebDavImportItem(item)}
                        >
                          {item.type === 'directory' ? <FolderOpen className="w-4 h-4 text-primary" /> : <Book className="w-4 h-4 text-muted-foreground" />}
                          <span className="flex-1 truncate">{item.basename}</span>
                          {item.type === 'file' && (item.basename.endsWith('.txt') || item.basename.endsWith('.TXT')) && (
                            <Plus className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full text-xs" onClick={() => setDirectoryItems([])}>更换连接信息</Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-xl space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" /> 方案 A：系统文件访问 (推荐)
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    点击下方按钮将打开 Android 系统文件选择器。在侧边栏中，您可以直接看到已安装的<b>百度网盘、阿里云盘、夸克</b>等并浏览其文件。
                  </p>
                  <Button className="w-full gap-2" onClick={() => { onNativeImport(); onClose(); }}>
                    <FolderOpen className="w-4 h-4" /> 唤起手机系统文件库
                  </Button>
                </div>

                <div className="bg-secondary/30 p-4 rounded-xl space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-primary" /> 方案 B：侧边分享
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    1. 在百度网盘等 App 中选中文件。<br />
                    2. 点击“分享”或“用其他应用打开”。<br />
                    3. 在弹出的应用列表中选择“<b>悦读</b>”即可。
                  </p>
                  <p className="text-[10px] text-muted-foreground">注意：此功能要求您已将“悦读”添加到手机桌面。</p>
                </div>
              </div>
            )}
            
            {error && <p className="text-destructive text-xs py-2">{error}</p>}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function EditBookDialog({ book, onClose, onSave }: { 
  book: BookData, 
  onClose: () => void, 
  onSave: (metadata: Partial<BookData>) => void 
}) {
  const [name, setName] = useState(book.name);
  const [author, setAuthor] = useState(book.author || '');
  const [tags, setTags] = useState<string[]>(book.tags);
  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑书籍信息</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">书名</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">作者</label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">标签</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <Badge key={tag} className="gap-1 pr-1 bg-primary/10 text-primary border-none hover:bg-primary/20">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="输入标签并回车" 
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }}
              />
              <Button size="icon" variant="outline" onClick={addTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={() => onSave({ name, author, tags })}>保存修改</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReaderView({ book, onBack, updateProgress }: { 
  book: BookData, 
  onBack: () => void,
  updateProgress: (pos: number, paraIdx: number) => void,
  key?: string
}) {
  const [content, setContent] = useState<string | null>(null);
  
  // Load default settings from localStorage
  const savedSettings = useMemo(() => {
    const saved = localStorage.getItem('yuedu_reader_settings');
    return saved ? JSON.parse(saved) : {
      fontSize: 20,
      fontFamily: 'serif',
      theme: 'light',
      flipMode: 'scroll',
      readingRate: 1.0,
      voiceURI: ''
    };
  }, []);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const [fontSize, setFontSize] = useState(savedSettings.fontSize);
  const [tempFontSize, setTempFontSize] = useState(fontSize);
  const fontSizeRef = useRef(fontSize);
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Sync font size to CSS variable for high-performance adjustment
  useEffect(() => {
    if (readerContainerRef.current) {
      readerContainerRef.current.style.setProperty('--reader-font-size', `${tempFontSize}px`);
    }
  }, [tempFontSize]);

  useEffect(() => {
    setTempFontSize(fontSize);
  }, [fontSize]);
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono' | 'kaiti'>(savedSettings.fontFamily);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>(savedSettings.theme);
  const [flipMode, setFlipMode] = useState<'scroll' | 'page'>(savedSettings.flipMode);

  // Optimization 2 states: Persistent highlights and selected paragraph operations
  const [highlights, setHighlights] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(`yuedu_highlights_${book.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedParagraphIndex, setSelectedParagraphIndex] = useState<number | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(`yuedu_highlights_${book.id}`, JSON.stringify(highlights));
    } catch (e) {
      console.error("Failed to persist highlights:", e);
    }
  }, [highlights, book.id]);
  const [voiceURI, setVoiceURI] = useState<string>(savedSettings.voiceURI);
  const voiceURIRef = useRef(voiceURI);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const voicesRef = useRef(availableVoices);
  
  const [activeParagraphIndex, setActiveParagraphIndex] = useState<number | null>(null);
  const activeIndexRef = useRef<number | null>(null);
  
  // Load content from IndexedDB
  useEffect(() => {
    getBookContent(book.id).then(c => setContent(c || ''));
  }, [book.id]);

  const paragraphs = useMemo(() => {
    if (!content) return [];
    return content.split(/\n+/).filter(p => p.trim().length > 0);
  }, [content]);

  const chapters = useMemo(() => {
    const chapterRegex = /^\s*(第[一二三四五六七八九十百千万\d\s]+[章节回部集卷篇幕].*|Chapter\s+\d+.*|Part\s+[\dIVXLCDM]+.*|正文\s+.*|序言|前言|后记|结语|尾声|番外.*)\s*$/i;
    const found = paragraphs.reduce((acc, para, index) => {
      if (chapterRegex.test(para)) {
        acc.push({ title: para.trim(), index });
      }
      return acc;
    }, [] as { title: string, index: number }[]);
    
    // Fallback: If no custom chapters are found in standard TXT ebooks, generate 10 proportional navigation checkpoints!
    if (found.length === 0 && paragraphs.length > 30) {
      const step = Math.ceil(paragraphs.length / 10);
      for (let i = 0; i < paragraphs.length; i += step) {
        // Use a preview of paragraph text
        const textPreview = paragraphs[i].slice(0, 15).trim() + (paragraphs[i].length > 15 ? '...' : '');
        found.push({
          title: `进程 ${Math.floor(i / step) * 10}% (${textPreview || '段落'})`,
          index: i
        });
      }
    }
    return found;
  }, [paragraphs]);

  // Keep fontSizeRef in sync
  useEffect(() => {
    fontSizeRef.current = fontSize;
  }, [fontSize]);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(0); // 0 to 100
  const [readingRate, setReadingRate] = useState(savedSettings.readingRate);
  const readingRateRef = useRef(readingRate);
  const [isReading, setIsReading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null); // minutes
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // seconds
  
  // Save settings as defaults whenever they change
  useEffect(() => {
    const settings = { fontSize, fontFamily, theme, flipMode, readingRate, voiceURI };
    localStorage.setItem('yuedu_reader_settings', JSON.stringify(settings));
  }, [fontSize, fontFamily, theme, flipMode, readingRate, voiceURI]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        // Preference: Chinese voices, then others
        const sorted = voices.sort((a, b) => {
          const aIsZh = a.lang.startsWith('zh');
          const bIsZh = b.lang.startsWith('zh');
          if (aIsZh && !bIsZh) return -1;
          if (!aIsZh && bIsZh) return 1;
          return a.name.localeCompare(b.name);
        });
        setAvailableVoices(sorted);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const visibleRangeRef = useRef({ startIndex: 0, endIndex: 0 });
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<{ current: number | null, current_page_flip: number | null }>({ current: null, current_page_flip: null });
  const speedRef = useRef(autoScrollSpeed);
  const flipModeRef = useRef(flipMode);
  const synth = window.speechSynthesis;
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsTimeoutRef = useRef<number | null>(null);
  const watchdogTimeoutRef = useRef<number | null>(null);
  const resumeIntervalRef = useRef<number | null>(null);
  const topItemIndexRef = useRef(0);

  const getCurrentTopIndex = useCallback(() => {
    const container = readerContainerRef.current;
    
    // Choose the best fallback in descending order of contextual freshness:
    // 1. Virtuoso's currently reported rendering start index (if scrolled)
    // 2. The tracking reference index (e.g. from restored database position)
    const fallbackIndex = visibleRangeRef.current.startIndex > 0 
      ? visibleRangeRef.current.startIndex 
      : topItemIndexRef.current;
      
    if (!container) return fallbackIndex;
    
    try {
      const containerRect = container.getBoundingClientRect();
      const triggerY = containerRect.top + 20; // 20px threshold from top of the reading window
      
      // Query all rendered paragraphs inside our specific container view
      const pElements = container.querySelectorAll('p[id^="p-"]');
      if (pElements.length === 0) {
        return fallbackIndex;
      }
      
      // Find the first paragraph whose bottom edge is below our top boundary trigger
      for (let i = 0; i < pElements.length; i++) {
        const el = pElements[i] as HTMLElement;
        const rect = el.getBoundingClientRect();
        
        // If the bottom edge of this paragraph text is below our trigger line, it is visible!
        if (rect.bottom > triggerY) {
          const idx = parseInt(el.id.replace('p-', ''), 10);
          if (!isNaN(idx)) {
            topItemIndexRef.current = idx;
            return idx;
          }
        }
      }
    } catch (e) {
      console.error("Failed to detect visible paragraph:", e);
    }
    
    return fallbackIndex;
  }, []);

  // Keep refs in sync
  useEffect(() => {
    voicesRef.current = availableVoices;
  }, [availableVoices]);

  useEffect(() => {
    speedRef.current = autoScrollSpeed;
  }, [autoScrollSpeed]);

  useEffect(() => {
    flipModeRef.current = flipMode;
  }, [flipMode]);

  // Auto Scroll/Flip Logic
  const animate = useCallback((time: number) => {
    if (lastTimeRef.current.current !== null && virtuosoRef.current) {
      const deltaTime = time - lastTimeRef.current.current;
      
      if (flipModeRef.current === 'scroll') {
        const pixelsPerSecond = speedRef.current * 2; 
        const offset = (pixelsPerSecond * deltaTime) / 1000;
        virtuosoRef.current.scrollBy({ top: offset, behavior: 'auto' });
      } else {
        const interval = Math.max(1000, (105 - speedRef.current) * 150);
        if (time - (lastTimeRef.current.current_page_flip || 0) > interval) {
          const containerHeight = scrollContainerRef.current?.clientHeight || 500;
          virtuosoRef.current.scrollBy({ top: containerHeight - 60, behavior: 'smooth' });
          lastTimeRef.current.current_page_flip = time;
        }
      }
    }
    
    if (lastTimeRef.current.current === null) {
      lastTimeRef.current.current_page_flip = time;
    }
    lastTimeRef.current.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }, []);

  // Removed redundant effect to consolidate above

  useEffect(() => {
    if (autoScrollSpeed > 0) {
      if (requestRef.current === null) {
        lastTimeRef.current.current = null;
        requestRef.current = requestAnimationFrame(animate);
      }
    } else {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      lastTimeRef.current.current = null;
    }
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [autoScrollSpeed, animate]);

  // TTS Logic
  const readNextParagraph = useCallback((index: number, immediate = false) => {
    if (index >= paragraphs.length) {
      setIsReading(false);
      setActiveParagraphIndex(null);
      activeIndexRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
      return;
    }

    // Clear any pending utterances first to avoid triggering stale onend/onerror
    synth.cancel();
    
    // iOS specific: Wait for cancel to propagate and force a resume
    if (isIOS) {
      synth.resume(); 
    }

    setActiveParagraphIndex(index);
    activeIndexRef.current = index;
    
    const text = paragraphs[index];
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply selected voice
    if (voiceURIRef.current) {
      const voice = voicesRef.current.find(v => v.voiceURI === voiceURIRef.current);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang; 
      }
    } else {
      utterance.lang = 'zh-CN';
    }
    
    // Robust rate sanitization
    const rate = typeof readingRateRef.current === 'number' 
      ? Math.max(0.1, Math.min(2.0, readingRateRef.current)) 
      : 1.0;
    utterance.rate = rate;
    
    utterance.onstart = () => {
      if (utteranceRef.current !== utterance) return;
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      
      // Clear any previous watchdog
      if (watchdogTimeoutRef.current) window.clearTimeout(watchdogTimeoutRef.current);
      
      // Safety watchdog: Estimate duration + 5s buffer. if onend doesn't fire, move forward.
      // Avg reading speed is ~300 chars/min, so ~200ms per char at 1x rate. 
      const estimatedDuration = (text.length * (200 / readingRateRef.current)) + 5000;
      watchdogTimeoutRef.current = window.setTimeout(() => {
        if (utteranceRef.current === utterance && isReadingRef.current) {
          console.warn("TTS Watchdog triggered for paragraph", index);
          utterance.onend?.(new SpeechSynthesisEvent('end', { utterance }));
        }
      }, estimatedDuration);

      // Start periodic resume hack (every 10s) to prevent engine from pausing automatically
      if (resumeIntervalRef.current) window.clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = window.setInterval(() => {
        if (synth.speaking && !synth.paused) {
          synth.pause();
          synth.resume();
        }
      }, 10000);
    };
    
    utterance.onend = () => {
      // Robust check: only continue if this is still the active utterance
      if (utteranceRef.current !== utterance) return;
      
      // Clear watchdog and interval
      if (watchdogTimeoutRef.current) window.clearTimeout(watchdogTimeoutRef.current);
      if (resumeIntervalRef.current) window.clearInterval(resumeIntervalRef.current);
      
      // Update progress as we read
      updateProgress(scrollContainerRef.current?.scrollTop || 0, index);
      
      // Keep silent audio playing to prevent background suspension
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().catch(() => {});
      }
      
      if (ttsTimeoutRef.current) window.clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = window.setTimeout(() => {
        if (activeIndexRef.current !== null && isReadingRef.current) {
          readNextParagraph(index + 1);
        }
      }, 300);
    };

    utterance.onerror = (event) => {
      if (utteranceRef.current !== utterance) return;
      if (watchdogTimeoutRef.current) window.clearTimeout(watchdogTimeoutRef.current);
      if (resumeIntervalRef.current) window.clearInterval(resumeIntervalRef.current);
      
      // 'interrupted' is normal when we cancel, skip clearing state
      if (event.error === 'interrupted') return;
      
      setIsReading(false);
      setActiveParagraphIndex(null);
      activeIndexRef.current = null;
      if (audioRef.current) audioRef.current.pause();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
    };

    utteranceRef.current = utterance;
    
    if (immediate) {
      // Synchronous call for user gesture reliability on iOS
      synth.speak(utterance);
    } else {
      // iOS Safari can be finicky about consecutive speak calls.
      // Small delays and explicit resume help keep the worker alive.
      if (ttsTimeoutRef.current) window.clearTimeout(ttsTimeoutRef.current);
      ttsTimeoutRef.current = window.setTimeout(() => {
        if (isReadingRef.current) {
          if (synth.paused) synth.resume();
          synth.speak(utterance);
        }
      }, isIOS ? 100 : 50);
    }

    // Only scroll if the paragraph is outside or near the bottom of the visible range
    const { startIndex, endIndex } = visibleRangeRef.current;
    const isVisible = index >= startIndex && index < endIndex - 1;
    
    if (!isVisible) {
      virtuosoRef.current?.scrollToIndex({
        index,
        align: 'start',
        behavior: 'smooth'
      });
    }
  }, [paragraphs, synth]);

  const toggleReading = useCallback(() => {
    if (isReading) {
      synth.cancel();
      if (ttsTimeoutRef.current) window.clearTimeout(ttsTimeoutRef.current);
      if (watchdogTimeoutRef.current) window.clearTimeout(watchdogTimeoutRef.current);
      if (resumeIntervalRef.current) window.clearInterval(resumeIntervalRef.current);
      
      setIsReading(false);
      setActiveParagraphIndex(null);
      activeIndexRef.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    } else {
      // Start silent audio immediately in user gesture stack to unlock TTS/MediaSession on iOS
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.log("Audio play failed:", e));
      }

      // Reset any active timers
      if (ttsTimeoutRef.current) window.clearTimeout(ttsTimeoutRef.current);
      if (watchdogTimeoutRef.current) window.clearTimeout(watchdogTimeoutRef.current);
      if (resumeIntervalRef.current) window.clearInterval(resumeIntervalRef.current);

      // CRITICAL FIX: Use the precise visible top index detection
      const startIndex = getCurrentTopIndex();
      
      // Clear queue and resume to fix common mobile browser TTS bugs
      synth.cancel();
      if (synth.paused) synth.resume();
      
      // Pass immediate=true to bypass the setTimeout for the first speak call
      readNextParagraph(startIndex, true); 
      setIsReading(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    }
  }, [isReading, readNextParagraph, synth, getCurrentTopIndex]);

  const startReadingFromIndex = useCallback((index: number) => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    if (ttsTimeoutRef.current) window.clearTimeout(ttsTimeoutRef.current);
    if (watchdogTimeoutRef.current) window.clearTimeout(watchdogTimeoutRef.current);
    if (resumeIntervalRef.current) window.clearInterval(resumeIntervalRef.current);
    synth.cancel();
    if (synth.paused) synth.resume();
    readNextParagraph(index, true); 
    setIsReading(true);
    if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
  }, [readNextParagraph, synth]);

  const toggleHighlight = useCallback((index: number) => {
    setHighlights(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }, []);

  // Voice/Rate sync and immediate feedback with debounce
  const rateSyncTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    voiceURIRef.current = voiceURI;
    readingRateRef.current = readingRate;
    
    // If voice or rate changes while reading, restart current paragraph for immediate feedback
    if (isReading && activeIndexRef.current !== null) {
      if (rateSyncTimeoutRef.current) window.clearTimeout(rateSyncTimeoutRef.current);
      rateSyncTimeoutRef.current = window.setTimeout(() => {
        if (isReading && activeIndexRef.current !== null) {
          synth.cancel();
          readNextParagraph(activeIndexRef.current);
        }
      }, 300); // 300ms debounce for smoother slider dragging
    }
    return () => {
      if (rateSyncTimeoutRef.current) window.clearTimeout(rateSyncTimeoutRef.current);
    };
  }, [voiceURI, readingRate, isReading, readNextParagraph, synth]);

  // Media Session Setup
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: book.name,
        artist: '悦读',
        album: '有声书',
        artwork: [
          { src: 'https://picsum.photos/seed/book/512/512', sizes: '512x512', type: 'image/png' }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        toggleReading();
      });
      navigator.mediaSession.setActionHandler('pause', () => {
        toggleReading();
      });
      navigator.mediaSession.setActionHandler('stop', () => {
        synth.cancel();
        setIsReading(false);
        setActiveParagraphIndex(null);
        activeIndexRef.current = null;
        if (audioRef.current) audioRef.current.pause();
        navigator.mediaSession.playbackState = 'none';
      });

      return () => {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('stop', null);
      };
    }
  }, [book.name, toggleReading, synth]);

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

  // Reset tracking when book changes
  const lastBookIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (book.id && book.id !== lastBookIdRef.current) {
      lastBookIdRef.current = book.id;
      topItemIndexRef.current = book.lastParagraphIndex || 0;
    }
  }, [book.id, book.lastParagraphIndex]);

  // Restore position when paragraphs are ready
  const hasRestoredRef = useRef(false);
  useEffect(() => {
    hasRestoredRef.current = false; // Reset restoration flag when book changes
  }, [book.id]);
  useEffect(() => {
    if (paragraphs.length > 0 && virtuosoRef.current && !hasRestoredRef.current) {
      hasRestoredRef.current = true;
      const targetIndex = book.lastParagraphIndex;
      const targetPos = book.lastPosition;

      if (targetIndex > 0) {
        // Ensure our tracking ref and visible range are aligned immediately
        topItemIndexRef.current = targetIndex;
        visibleRangeRef.current = { startIndex: targetIndex, endIndex: targetIndex + 5 };
        
        // Use paragraph index for more precise restoration in virtualized lists
        virtuosoRef.current.scrollToIndex({
          index: targetIndex,
          align: 'start',
          behavior: 'auto'
        });
      } else if (targetPos > 0) {
        // Fallback to pixel position
        virtuosoRef.current.scrollTo({ top: targetPos });
      }
    }
  }, [paragraphs, book.lastParagraphIndex, book.lastPosition]);

  // Save position on scroll (debounced)
  const scrollTimeoutRef = useRef<number | null>(null);
  const handleScroll = useCallback((scrollTop: number) => {
    if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = window.setTimeout(() => {
      // Use accurate detection for progress saving too
      const topIdx = getCurrentTopIndex();
      updateProgress(scrollTop, topIdx);
    }, 500);
  }, [updateProgress, getCurrentTopIndex]);

  const isReadingRef = useRef(isReading);
  useEffect(() => {
    isReadingRef.current = isReading;
  }, [isReading]);

  // Robust cleanup of all app-wide side effects
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) window.clearTimeout(scrollTimeoutRef.current);
      if (ttsTimeoutRef.current) window.clearTimeout(ttsTimeoutRef.current);
      if (watchdogTimeoutRef.current) window.clearTimeout(watchdogTimeoutRef.current);
      if (resumeIntervalRef.current) window.clearInterval(resumeIntervalRef.current);
      if (rateSyncTimeoutRef.current) window.clearTimeout(rateSyncTimeoutRef.current);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (utteranceRef.current) {
        utteranceRef.current.onstart = null;
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      synth.cancel();
    };
  }, [synth]);

  const themeConfig = {
    light: { bg: 'bg-[#fdfcf8]', text: 'text-[#1c1917]', border: 'border-[#e7e5e4]' },
    dark: { bg: 'bg-[#121212]', text: 'text-[#e0e0e0]', border: 'border-[#333333]' },
    sepia: { bg: 'bg-[#f4ecd8]', text: 'text-[#5b4636]', border: 'border-[#d3c6a8]' }
  };

  const fontConfig = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    kaiti: 'font-kaiti'
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
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <List className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className={cn("w-[300px] sm:w-[400px]", themeConfig[theme].bg, themeConfig[theme].text, themeConfig[theme].border)}>
              <SheetHeader>
                <SheetTitle className={themeConfig[theme].text}>目录 ({chapters.length})</SheetTitle>
              </SheetHeader>
              <div className="mt-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-2 custom-scrollbar">
                {chapters.length > 0 ? (
                  <div className="space-y-1">
                    {chapters.map((chapter, idx) => (
                      <SheetClose asChild key={idx}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-left font-normal h-auto py-3 px-4 hover:bg-primary/10"
                          onClick={() => {
                            virtuosoRef.current?.scrollToIndex({
                              index: chapter.index,
                              align: 'start',
                              behavior: 'auto'
                            });
                          }}
                        >
                          <span className="line-clamp-2">{chapter.title}</span>
                        </Button>
                      </SheetClose>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <p>未检测到章节标识</p>
                    <p className="text-xs mt-2">支持“第一章”、“Chapter 1”等格式</p>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {timeLeft !== null && (
            <div className="flex items-center gap-1 text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded-full mr-2">
              <Clock className="w-3 h-3" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={cn(isSettingsOpen && "bg-primary/20")}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Content */}
      <div 
        ref={readerContainerRef}
        className="flex-1 overflow-hidden relative"
      >
        {!content ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Virtuoso
            ref={virtuosoRef}
            scrollerRef={(el) => (scrollContainerRef.current = el as HTMLDivElement)}
            data={paragraphs}
            rangeChanged={(range) => {
              visibleRangeRef.current = range;
            }}
            onScroll={(e) => handleScroll((e.target as HTMLDivElement).scrollTop)}
            itemContent={(idx, para) => {
              const isHighlighted = highlights.includes(idx);
              const isSelected = selectedParagraphIndex === idx;
              const isActive = activeParagraphIndex === idx;

              return (
                <div 
                  className="px-6 py-2 md:px-12 lg:px-24"
                  style={{ touchAction: 'pan-y' }} // Help iOS touch performance
                >
                  <p 
                    id={`p-${idx}`}
                    onClick={() => {
                      setSelectedParagraphIndex(prev => prev === idx ? null : idx);
                    }}
                    className={cn(
                      "max-w-2xl mx-auto leading-relaxed text-justify transition-all duration-300 rounded-lg px-2 -mx-2 cursor-pointer select-text",
                      fontConfig[fontFamily],
                      chapters.some(c => c.index === idx) ? "font-bold text-xl mt-8 mb-4 border-l-4 border-primary pl-4" : "mb-6",
                      isActive 
                        ? "bg-primary/25 text-primary scale-[1.012] shadow-sm font-semibold" 
                        : "",
                      isHighlighted 
                        ? "bg-yellow-500/15 dark:bg-yellow-500/10 shadow-[inset_0_-3px_0_0_rgba(234,179,8,0.7)]" 
                        : "",
                      isSelected 
                        ? "ring-2 ring-primary/40 bg-primary/5 shadow-md scale-[1.01]" 
                        : "hover:bg-primary/5"
                    )}
                    style={{ 
                      fontSize: 'var(--reader-font-size)', 
                      lineHeight: '1.9'
                    }}
                  >
                    {para}
                  </p>
                </div>
              );
            }}
            style={{ height: '100%' }}
          />
        )}

        {/* Floating Toolbar for Selected Paragraph */}
        <AnimatePresence>
          {selectedParagraphIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg bg-background/95 dark:bg-[#1c1c1e]/95 backdrop-blur-md border border-muted-foreground/10 shadow-xl rounded-2xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                  段落 #{selectedParagraphIndex + 1}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedParagraphIndex(null);
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 border-primary/30 pl-2 leading-relaxed">
                "{paragraphs[selectedParagraphIndex]}"
              </p>

              <div className="flex items-center justify-between gap-2 mt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 text-xs h-9 rounded-xl border-dashed"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleHighlight(selectedParagraphIndex);
                    setSelectedParagraphIndex(null);
                  }}
                >
                  <Highlighter className="h-3.5 w-3.5 text-yellow-500" />
                  {highlights.includes(selectedParagraphIndex) ? "取消高亮" : "高亮标记"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 text-xs h-9 rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    startReadingFromIndex(selectedParagraphIndex);
                    setSelectedParagraphIndex(null);
                  }}
                >
                  <Volume2 className="h-3.5 w-3.5 text-primary animate-pulse" />
                  由此朗读
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1.5 text-xs h-9 rounded-xl"
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      navigator.clipboard.writeText(paragraphs[selectedParagraphIndex!]);
                      setShowCopiedToast(true);
                      setTimeout(() => setShowCopiedToast(false), 2000);
                    } catch (err) {
                      console.error("Failed to copy text:", err);
                    }
                    setSelectedParagraphIndex(null);
                  }}
                >
                  <Copy className="h-3.5 w-3.5 text-blue-500" />
                  复制段落
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Copy confirmation notification */}
        <AnimatePresence>
          {showCopiedToast && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-50 bg-neutral-900/90 text-white dark:bg-neutral-100 dark:text-black text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 border border-muted-foreground/10"
            >
              <Check className="h-4 w-4 text-green-500" />
              已复制到系统剪贴板
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Controls */}
      <footer className={cn("h-20 border-t flex items-center justify-center gap-8 px-6 transition-colors duration-300", themeConfig[theme].bg, themeConfig[theme].border)}>
        {/* Silent audio to keep MediaSession / Speech alive on iOS */}
        <audio 
          ref={audioRef} 
          loop 
          src="data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="
        />
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

      {/* Draggable Settings Window */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed right-4 top-20 z-50 w-[320px] max-h-[70vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-colors duration-300",
              themeConfig[theme].bg,
              themeConfig[theme].border,
              themeConfig[theme].text
            )}
          >
            {/* Header / Drag handle */}
            <div className="flex items-center justify-between p-4 border-b shrink-0 cursor-move bg-secondary/10">
              <div className="flex items-center gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold text-sm">阅读设置</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsSettingsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
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

              {/* Flip Mode Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Book className="w-4 h-4" />
                  <span className="text-sm font-medium">翻页模式</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={flipMode === 'scroll' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setFlipMode('scroll')}
                  >
                    平滑滚动
                  </Button>
                  <Button 
                    variant={flipMode === 'page' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setFlipMode('page')}
                  >
                    整页翻页
                  </Button>
                </div>
              </div>

              {/* Font Family Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Type className="w-4 h-4" />
                  <span className="text-sm font-medium">字体样式</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={fontFamily === 'sans' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setFontFamily('sans')}
                    className="font-sans"
                  >
                    黑体
                  </Button>
                  <Button 
                    variant={fontFamily === 'serif' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setFontFamily('serif')}
                    className="font-serif"
                  >
                    宋体
                  </Button>
                  <Button 
                    variant={fontFamily === 'kaiti' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setFontFamily('kaiti')}
                    style={{ fontFamily: 'KaiTi, STKaiti, serif' }}
                  >
                    楷体
                  </Button>
                  <Button 
                    variant={fontFamily === 'mono' ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setFontFamily('mono')}
                    className="font-mono"
                  >
                    等宽
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
                      onClick={() => {
                        const next = Math.max(12, fontSize - 2);
                        setFontSize(next);
                        setTempFontSize(next);
                      }}
                    >
                      -
                    </Button>
                    <span className="text-sm font-mono w-8 text-center">{tempFontSize}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => {
                        const next = Math.min(40, fontSize + 2);
                        setFontSize(next);
                        setTempFontSize(next);
                      }}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <Slider 
                  value={[tempFontSize]} 
                  min={12} 
                  max={40} 
                  step={1} 
                  onValueChange={(v: number[]) => setTempFontSize(v[0])}
                  // @ts-ignore - Radix Slider has onValueCommit
                  onValueCommit={(v: number[]) => setFontSize(v[0])}
                />
              </div>

              {/* Auto Scroll/Flip Speed */}
              <div className="space-y-4 pt-4 border-t border-muted-foreground/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FastForward className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">自动翻页设置</span>
                  </div>
                  <Button 
                    variant={autoScrollSpeed > 0 ? "default" : "outline"} 
                    size="sm" 
                    className="h-7 px-3 text-[10px] rounded-full"
                    onClick={() => setAutoScrollSpeed(prev => prev > 0 ? 0 : 20)}
                  >
                    {autoScrollSpeed > 0 ? "运行中" : "已停止"}
                  </Button>
                </div>
                
                <div className="space-y-4 px-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {flipMode === 'scroll' ? '滚动速度' : '翻页间隔'}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full border"
                        onClick={() => setAutoScrollSpeed(prev => Math.max(0, prev - 5))}
                      >
                        <span className="text-xs">-</span>
                      </Button>
                      <span className="text-xs font-mono w-6 text-center">{autoScrollSpeed}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-full border"
                        onClick={() => setAutoScrollSpeed(prev => Math.min(100, prev + 5))}
                      >
                        <span className="text-xs">+</span>
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
                  <div className="flex justify-between items-center bg-secondary/30 p-2 rounded-lg">
                    <p className="text-[10px] text-muted-foreground italic">
                      {flipMode === 'scroll' 
                        ? '流畅滚动模式：数值越大滚动速度越快。' 
                        : `整页模式：每一页停留约 ${Math.round((105 - autoScrollSpeed) * 0.15)} 秒。`}
                    </p>
                  </div>
                </div>
              </div>

              {/* TTS Settings Group */}
              <div className="space-y-4 pt-4 border-t border-muted-foreground/10">
                <div className="flex items-center gap-2 text-primary">
                  <Volume2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">语音朗读设置</span>
                </div>

                {/* Voice Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">选择音色 (含 AI 模型音色)</label>
                  <Select value={voiceURI} onValueChange={setVoiceURI}>
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="系统默认 (中文)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">系统默认 (自动选择)</SelectItem>
                      {availableVoices.map(voice => (
                        <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-xs">
                          {voice.name}
                          {voice.localService ? ' (本地)' : ' (云端/AI)'}
                          {voice.lang.includes('zh') ? ' [中文]' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">
                    提示：部分云端语音具有更自然的 AI 朗读效果。
                  </p>
                </div>

                {/* Reading Rate */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">朗读语速</span>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => setReadingRate(prev => Math.max(0.5, Math.round((prev - 0.1) * 10) / 10))}
                      >
                        -
                      </Button>
                      <span className="text-xs font-mono w-8 text-center">{readingRate.toFixed(1)}</span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => setReadingRate(prev => Math.min(2.0, Math.round((prev + 0.1) * 10) / 10))}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                  <Slider 
                    value={[readingRate]} 
                    min={0.5} 
                    max={2.0} 
                    step={0.1} 
                    onValueChange={(v: number[]) => setReadingRate(v[0])} 
                  />
                </div>
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

              <div className="pt-4 border-t border-muted-foreground/10 text-center">
                <p className="text-[10px] font-mono text-muted-foreground opacity-50">悦读 v1.0.1</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <audio 
        ref={audioRef} 
        src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==" 
        loop 
        preload="auto" 
        className="hidden" 
      />
    </motion.div>
  );
}
