'use client';

import { useState, useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { categories } from '@/lib/categories';
import { Separator } from './ui/separator';

interface CategoryFilterProps {
  selectedCategories: string[];
  onApply: (categories: string[]) => void;
}

export function CategoryFilter({
  selectedCategories,
  onApply,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tempSelected, setTempSelected] = useState<string[]>(selectedCategories);

  const filteredCategories = useMemo(() => {
    return categories.filter(category =>
      category.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const handleApply = () => {
    onApply(tempSelected);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelected(selectedCategories);
    setIsOpen(false);
  };

  const handleClearAll = () => {
    setTempSelected([]);
  };

  const handleCheckboxChange = (categoryName: string, checked: boolean) => {
    setTempSelected(prev =>
      checked ? [...prev, categoryName] : prev.filter(c => c !== categoryName)
    );
  };

  const getButtonLabel = () => {
    if (selectedCategories.length === 0) return 'Category';
    if (selectedCategories.length === 1) return selectedCategories[0];
    return `${selectedCategories.length} categories`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto flex-grow sm:flex-grow-0 min-w-[120px] justify-start text-left font-normal">
          <span className="truncate">{getButtonLabel()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-[500px] p-0" align="start">
        <div className="p-4">
          <h4 className="font-medium leading-none mb-4">All Categories</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-64">
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCategories.map(category => (
              <div key={category.name} className="flex items-center space-x-2">
                <Checkbox
                  id={category.name}
                  checked={tempSelected.includes(category.name)}
                  onCheckedChange={checked =>
                    handleCheckboxChange(category.name, !!checked)
                  }
                />
                <Label
                  htmlFor={category.name}
                  className="font-normal cursor-pointer flex-1"
                >
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <Separator />
        <div className="flex justify-between items-center p-4">
          <Button variant="ghost" onClick={handleClearAll} className="p-0 h-auto">
            Clear all
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
