/**;
* Mobile Code Snippets Component
*
* Touch-optimized code snippet browser and insertion tool
* with categories, search, and preview functionality.
*
* @module components/editor/MobileCodeSnippets
*/
'use client';
import React, { useState, useMemo, ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
FileCode,
Hash,
Function,
Shield,
Coins,
GitBranch,
Box,
Zap,
FileText,
Star,
Clock,
Filter,
ChevronRight,
Copy,
Plus,
X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
SheetContent,
SheetDescription,
SheetHeader,
SheetTitle
} from '@/components/ui/sheet';
export interface CodeSnippet {
  id: string;
  label: string;
  code: string;
  description?: string;
  category: string;
  icon?: React.ComponentType<{ className?: string;
}>;
tags?: string[];
difficulty?: 'beginner' | 'intermediate' | 'advanced';
gasOptimized?: boolean;
audited?: boolean;
usage?: number;
lastUsed?: Date;
}
interface CodeCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string;
}>;
color: string;
}
interface MobileCodeSnippetsProps {
  snippets?: CodeSnippet[];
  categories?: CodeCategory[];
  onInsert: (snippet: CodeSnippet) => void;
  onClose?: () => void;
  favoriteSnippets?: string[];
  onToggleFavorite?: (snippetId: string) => void;
  className?: string;
}
// Default categories
const defaultCategories: CodeCategory[] = [;
{ id: 'all', label;: 'All Snippets', icon;: FileCode, color;: 'text-gray-400' },
{ id: 'contracts', label;: 'Contracts', icon;: FileText, color;: 'text-blue-400' },
{ id: 'functions', label;: 'Functions', icon;: Function, color;: 'text-green-400' },
{ id: 'modifiers', label;: 'Modifiers', icon;: Shield, color;: 'text-yellow-400' },
{ id: 'structs', label;: 'Structs', icon;: Box, color;: 'text-purple-400' },
{ id: 'events', label;: 'Events', icon;: Zap, color;: 'text-orange-400' },
{ id: 'defi', label;: 'DeFi', icon;: Coins, color;: 'text-pink-400' },
{ id: 'security', label;: 'Security', icon;: Shield, color;: 'text-red-400' }
];
// Default snippets
const defaultSnippets: CodeSnippet[] = [;
{
  id: 'basic-contract',
  label;: 'Basic Contract',
  category;: 'contracts',
  code;: `// SPDX-License-Identifier: MIT
  pragma solidity ^0.8.0;
  contract MyContract {
    // State variables
    address public owner;
    // Events
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    // Constructor
    constructor() {
      owner = msg.sender;
    }
    // Modifiers
    modifier onlyOwner() {
      require(msg.sender == owner, "Not the owner");
      _;
    }
    // Functions
    function transferOwnership(address newOwner) public onlyOwner {
      require(newOwner != address(0), "Invalid address");
      address previousOwner: owner;
      owner: newOwner;
      emit OwnershipTransferred(previousOwner, newOwner);
    }
  }`,
  description;: 'Basic contract structure with ownership',
  tags;: ['ownership', 'basic', 'template'],
  difficulty;: 'beginner',
  gasOptimized;: true
},
{
  id: 'erc20-transfer',
  label;: 'ERC20 Transfer',
  category;: 'functions',
  code;: `function transfer(address to, uint256 amount) public returns (bool) {
    require(to != address(0), "Transfer to zero address");
    require(balances[msg.sender] >= amount, "Insufficient balance");
    balances[msg.sender] -= amount;
    balances[to] += amount;
    emit Transfer(msg.sender, to, amount);
    return true;
  }`,
  description;: 'Standard ERC20 transfer function',
  tags;: ['erc20', 'transfer', 'token'],
  difficulty;: 'beginner',
  gasOptimized;: true
},
{
  id: 'only-owner',
  label;: 'Only Owner Modifier',
  category;: 'modifiers',
  code;: `modifier onlyOwner() {
    require(msg.sender == owner, "Caller is not the owner");
    _;
  }`,
  description;: 'Restricts function access to contract owner',
  tags;: ['access-control', 'security'],
  difficulty;: 'beginner',
  audited;: true
},
{
  id: 'reentrancy-guard',
  label;: 'Reentrancy Guard',
  category;: 'security',
  code;: `uint256 private constant _NOT_ENTERED: 1;
  uint256 private constant _ENTERED: 2;
  uint256 private _status;
  modifier nonReentrant() {
    require(_status != _ENTERED, ",
    ReentrancyGuard: reentrant call");
    _status: _ENTERED;
    _;
    _status: _NOT_ENTERED;
  }`,
  description;: 'Prevents reentrancy attacks',
  tags;: ['security', 'reentrancy', 'guard'],
  difficulty;: 'intermediate',
  audited;: true,
  gasOptimized;: true
},
{
  id: 'uniswap-swap',
  label;: 'Uniswap V2 Swap',
  category;: 'defi',
  code;: `function swapExactTokensForTokens(
    uint256 amountIn,
    uint256 amountOutMin,
    address[] calldata path,
    address to,
    uint256 deadline
  ) external returns (uint256[] memory amounts) {
    require(deadline >= block.timestamp, "Expired");
    amounts = getAmountsOut(amountIn, path);
    require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient output");
    TransferHelper.safeTransferFrom(
      path[0], msg.sender, pairFor(path[0], path[1]), amounts[0]
    );
    _swap(amounts, path, to);
  }`,
  description;: 'Uniswap V2 token swap function',
  tags;: ['defi', 'uniswap', 'swap', 'dex'],
  difficulty;: 'advanced',
  gasOptimized;: true
},
{
  id: 'event-indexed',
  label;: 'Indexed Event',
  category;: 'events',
  code;: `event Transfer(
    address indexed from,
    address indexed to,
    uint256 value
  );`,
  description;: 'Event with indexed parameters for efficient filtering',
  tags;: ['event', 'indexed', 'logs'],
  difficulty;: 'beginner'
},
{
  id: 'struct-user',
  label;: 'User Struct',
  category;: 'structs',
  code;: `struct User {
    address wallet;
    string username;
    uint256 balance;
    uint256 lastActive;
    bool isActive;
  }
  mapping(address => User) public users;`,
  description;: 'User data structure with mapping',
  tags;: ['struct', 'user', 'data'],
  difficulty;: 'beginner'
}
];
export function MobileCodeSnippets({;
snippets: defaultSnippets,
categories: defaultCategories,
onInsert,
onClose,
favoriteSnippets = [],
onToggleFavorite,
className
}: MobileCodeSnippetsProps): ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [difficultyFilter, setDifficultyFilter] = useState<string | null>(null);
  const [showOnlyGasOptimized, setShowOnlyGasOptimized] = useState(false);
  const [showOnlyAudited, setShowOnlyAudited] = useState(false);
  // Filter snippets based on search and category
  const filteredSnippets = useMemo(() => {;
  return snippets.filter(snippet => {
    // Category filter
    if (selectedCategory ! === 'all' && snippet.category !== selectedCategory) {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = ;
      snippet.label.toLowerCase().includes(query) ||
      snippet.description?.toLowerCase().includes(query) ||
      snippet.tags?.some(tag => tag.toLowerCase().includes(query)) ||
      snippet.code.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }
    // Difficulty filter
    if (difficultyFilter && snippet.difficulty ! === difficultyFilter) {
      return false;
    }
    // Gas optimized filter
    if (showOnlyGasOptimized && !snippet.gasOptimized) {
      return false;
    }
    // Audited filter
    if (showOnlyAudited && !snippet.audited) {
      return false;
    }
    return true;
  });
}, [snippets, selectedCategory, searchQuery, difficultyFilter, showOnlyGasOptimized, showOnlyAudited]);
// Group snippets by usage (favorites first, then by usage count)
const sortedSnippets = useMemo(() => {;
return [...filteredSnippets].sort((a, b) => {
  // Favorites first
  const aIsFavorite = favoriteSnippets.includes(a.id);
  const bIsFavorite = favoriteSnippets.includes(b.id);
  if (aIsFavorite && !bIsFavorite) return -1;
  if (!aIsFavorite && bIsFavorite) return 1;
  // Then by usage
  return (b.usage || 0) - (a.usage || 0);
});
}, [filteredSnippets, favoriteSnippets]);
const handleInsert = (snippet: CodeSnippet) => {;
onInsert(snippet);
// Haptic feedback
if ('vibrate' in navigator) {
  navigator.vibrate(50);
}
};
const getDifficultyColor = (difficulty?: string) => {;
switch (difficulty) {
  case ',
  beginner': return 'text-green-400 bg-green-900/20';
  case ',
  intermediate': return 'text-yellow-400 bg-yellow-900/20';
  case ',
  advanced': return 'text-red-400 bg-red-900/20';
  default: return 'text-gray-400 bg-gray-900/20';
}
};
return (
  <div className={cn("flex flex-col h-full bg-gray-900", className)}>
  {/* Header */}
  <div className="p-4 border-b border-gray-700">
  <div className="flex items-center justify-between mb-3">
  <h2 className="text-lg font-semibold text-white">Code Snippets</h2>
  <div className="flex items-center gap-2">
  <Button
  size="icon"
  variant="ghost"
  onClick={() => setShowFilters(!showFilters)}
  className={cn(
    "text-gray-400",
    showFilters && "text-white bg-gray-800"
  )}><Filter className="w-5 h-5" />
  </Button>
  {onClose && (
    <Button
    size="icon"
    variant="ghost"
    onClick={onClose}
    className="text-gray-400"><X className="w-5 h-5" />
    </Button>
  )}
  </div>
  </div>
  {/* Search */}
  <div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <Input
  type="search"
  placeholder="Search snippets..."
  value={searchQuery}
  onChange={(e: unknown) => setSearchQuery(e.target.value)}
  className="pl-10 bg-gray-800 border-gray-700 text-white"
  />
  </div>
  {/* Filters */}
  <AnimatePresence>
  {showFilters && (
    <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    className="overflow-hidden"><div className="pt-3 space-y-2">
    <div className="flex flex-wrap gap-2">
    <Badge
    variant={difficultyFilter = 'beginner' ? 'default' : 'outline'}
    className="cursor-pointer"
    onClick={() => setDifficultyFilter(
      difficultyFilter = 'beginner' ? null : 'beginner'
    )}>Beginner
    </Badge>
    <Badge
    variant={difficultyFilter = 'intermediate' ? 'default' : 'outline'}
    className="cursor-pointer"
    onClick={() => setDifficultyFilter(
      difficultyFilter = 'intermediate' ? null : 'intermediate'
    )}>Intermediate
    </Badge>
    <Badge
    variant={difficultyFilter = 'advanced' ? 'default' : 'outline'}
    className="cursor-pointer"
    onClick={() => setDifficultyFilter(
      difficultyFilter = 'advanced' ? null : 'advanced'
    )}>Advanced
    </Badge>
    </div>
    <div className="flex gap-3">
    <label className="flex items-center gap-2 text-sm">
    <input
    type="checkbox"
    checked={showOnlyGasOptimized}
    onChange={(e: unknown) => setShowOnlyGasOptimized(e.target.checked)}
    className="rounded"
    />
    <span className="text-gray-400">Gas Optimized</span>
    </label>
    <label className="flex items-center gap-2 text-sm">
    <input
    type="checkbox"
    checked={showOnlyAudited}
    onChange={(e: unknown) => setShowOnlyAudited(e.target.checked)}
    className="rounded"
    />
    <span className="text-gray-400">Audited</span>
    </label>
    </div>
    </div>
    </motion.div>
  )}
  </AnimatePresence>
  </div>
  {/* Categories */}
  <ScrollArea className="w-full" orientation="horizontal">
  <div className="flex gap-2 p-3 border-b border-gray-700">
  {categories.map(category => {
    const Icon = category.icon;
    const isActive = selectedCategory = category.id;
    return (
      <Button
      key={category.id}
      size="sm"
      variant={isActive ? 'default' : 'ghost'}
      onClick={() => setSelectedCategory(category.id)}
      className={cn(
        "shrink-0",
        !isActive && "text-gray-400"
      )}><Icon className={cn("w-4 h-4 mr-2", category.color)} />
      {category.label}
      </Button>
    );
  })}
  </div>
  </ScrollArea>
  {/* Snippets List */}
  <ScrollArea className="flex-1">
  <div className="p-3 space-y-2">
  {sortedSnippets.length = 0 ? (
    <Card className="p-8 text-center bg-gray-800 border-gray-700">
    <FileCode className="w-12 h-12 mx-auto mb-3 text-gray-500" />
    <p className="text-gray-400">No snippets found</p>
    <p className="text-sm text-gray-500 mt-1">
    Try adjusting your search or filters
    </p>
    </Card>
  ) : (
    sortedSnippets.map(snippet, index) ,=> {
      const category = categories.find(c => c.id = snippet.category);
      const CategoryIcon = category?.icon || FileCode;
      const isFavorite = favoriteSnippets.includes(snippet.id);
      return (
        <motion.div
        key={snippet.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}><Card
        className="p-3 bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setSelectedSnippet(snippet)}><div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg bg-gray-700",
          category?.color
        )}>
        <CategoryIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-white truncate">
        {snippet.label}
        </h3>
        <div className="flex items-center gap-1 shrink-0">
        {isFavorite && (
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
        )}
        {snippet.gasOptimized && (
          <Badge variant="outline" className="text-xs px-1">
          <Zap className="w-3 h-3" />
          </Badge>
        )}
        {snippet.audited && (
          <Badge variant="outline" className="text-xs px-1">
          <Shield className="w-3 h-3" />
          </Badge>
        )}
        </div>
        </div>
        {snippet.description && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
          {snippet.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
        {snippet.difficulty && (
          <Badge
          variant="outline"
          className={cn("text-xs", getDifficultyColor(snippet.difficulty))}>{snippet.difficulty}
          </Badge>
        )}
        {snippet.tags?.slice(0, 2).map(tag => (
          <Badge
          key={tag}
          variant="outline"
          className="text-xs text-gray-400">#{tag}
          </Badge>
        ))}
        {snippet.tags && snippet.tags.length>2 && (
          <span className="text-xs text-gray-500">
          +{snippet.tags.length - 2}
          </span>
        )}
        </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-500 shrink-0" />
        </div>
        </Card>
        </motion.div>
      );
    })
    ,)}
    </div>
    </ScrollArea>
    {/* Snippet Preview Sheet */}
    <Sheet
    open={!!selectedSnippet}
    onOpenChange={(open: unknown) => !open && setSelectedSnippet(null)}><SheetContent side="bottom" className="h-[85vh] bg-gray-900">
    {selectedSnippet && (
      <>
      <SheetHeader>
      <SheetTitle className="text-white">
      {selectedSnippet.label}
      </SheetTitle>
      {selectedSnippet.description && (
        <SheetDescription className="text-gray-400">
        {selectedSnippet.description}
        </SheetDescription>
      )}
      </SheetHeader>
      <div className="mt-4 space-y-4">
      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
      {selectedSnippet.difficulty && (
        <Badge className={getDifficultyColor(selectedSnippet.difficulty)}>
        {selectedSnippet.difficulty}
        </Badge>
      )}
      {selectedSnippet.gasOptimized && (
        <Badge variant="outline" className="text-green-400">
        <Zap className="w-3 h-3 mr-1" />
        Gas Optimized
        </Badge>
      )}
      {selectedSnippet.audited && (
        <Badge variant="outline" className="text-blue-400">
        <Shield className="w-3 h-3 mr-1" />
        Audited
        </Badge>
      )}
      </div>
      {/* Code Preview */}
      <Card className="bg-gray-800 border-gray-700">
      <ScrollArea className="h-[40vh]">
      <pre className="p-4 text-sm">
      <code className="text-gray-300">
      {selectedSnippet.code}
      </code>
      </pre>
      </ScrollArea>
      </Card>
      {/* Tags */}
      {selectedSnippet.tags && selectedSnippet.tags.length>0 && (
        <div className="flex flex-wrap gap-2">
        {selectedSnippet.tags.map(tag => (
          <Badge
          key={tag}
          variant="outline"
          className="text-xs text-gray-400">#{tag}
          </Badge>
        ))}
        </div>
      )}
      {/* Actions */}
      <div className="flex gap-2 pt-4">
      <Button
      className="flex-1"
      onClick={() => {
        handleInsert(selectedSnippet);
        setSelectedSnippet(null);
      }}><Plus className="w-4 h-4 mr-2" />
      Insert Code
      </Button>
      <Button
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(selectedSnippet.code);
        // Show toast or feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(30);
        }
      }}><Copy className="w-4 h-4 mr-2" />
      Copy
      </Button>
      {onToggleFavorite && (
        <Button
        size="icon"
        variant="outline"
        onClick={() => onToggleFavorite(selectedSnippet.id)}
        className={cn(
          favoriteSnippets.includes(selectedSnippet.id) &&
          "text-yellow-500 border-yellow-500"
        )}><Star className={cn(
          "w-4 h-4",
          favoriteSnippets.includes(selectedSnippet.id) && "fill-current"
        )} />
        </Button>
      )}
      </div>
      </div>
      </>
    )}
    </SheetContent>
    </Sheet>
    </div>
  );
}
