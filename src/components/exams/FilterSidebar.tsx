import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-semibold text-foreground mb-3 hover:text-primary transition-colors"
      >
        {title}
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && <div className="space-y-2 animate-fade-in">{children}</div>}
    </div>
  );
}

interface FilterCheckboxProps {
  id: string;
  label: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

function FilterCheckbox({ id, label, checked, onChange }: FilterCheckboxProps) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox 
        id={id} 
        checked={checked} 
        onCheckedChange={onChange}
        className="border-2"
      />
      <Label htmlFor={id} className="text-sm cursor-pointer hover:text-primary transition-colors">
        {label}
      </Label>
    </div>
  );
}

export function FilterSidebar() {
  const [priceFilter, setPriceFilter] = useState<string[]>([]);
  const [ownershipFilter, setOwnershipFilter] = useState<string[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [contestFilter, setContestFilter] = useState<string[]>([]);

  const toggleFilter = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    if (arr.includes(value)) {
      setArr(arr.filter(v => v !== value));
    } else {
      setArr([...arr, value]);
    }
  };

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-card rounded-xl p-4 shadow-card sticky top-20">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-lg">Bộ lọc</h2>
        </div>

        <FilterSection title="Hình thức">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={priceFilter.includes("all") ? "default" : "outline"} 
              size="xs"
              onClick={() => toggleFilter(priceFilter, setPriceFilter, "all")}
            >
              Tất cả
            </Button>
            <Button 
              variant={priceFilter.includes("free") ? "default" : "outline"} 
              size="xs"
              onClick={() => toggleFilter(priceFilter, setPriceFilter, "free")}
            >
              Trả phí
            </Button>
            <Button 
              variant={priceFilter.includes("paid") ? "default" : "outline"} 
              size="xs"
              onClick={() => toggleFilter(priceFilter, setPriceFilter, "paid")}
            >
              Miễn phí
            </Button>
          </div>
        </FilterSection>

        <FilterSection title="Tình trạng sở hữu">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={ownershipFilter.includes("all") ? "default" : "outline"} 
              size="xs"
              onClick={() => toggleFilter(ownershipFilter, setOwnershipFilter, "all")}
            >
              Tất cả
            </Button>
            <Button 
              variant={ownershipFilter.includes("purchased") ? "default" : "outline"} 
              size="xs"
              onClick={() => toggleFilter(ownershipFilter, setOwnershipFilter, "purchased")}
            >
              Đã mua
            </Button>
          </div>
        </FilterSection>

        <FilterSection title="Khối lớp">
          <div className="grid grid-cols-3 gap-2">
            <FilterCheckbox 
              id="grade-all" 
              label="Tất cả" 
              checked={gradeFilter.includes("all")}
              onChange={() => toggleFilter(gradeFilter, setGradeFilter, "all")}
            />
            {[1, 2, 3, 4, 5].map(grade => (
              <FilterCheckbox 
                key={grade}
                id={`grade-${grade}`} 
                label={`Lớp ${grade}`}
                checked={gradeFilter.includes(`${grade}`)}
                onChange={() => toggleFilter(gradeFilter, setGradeFilter, `${grade}`)}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Môn học">
          <div className="space-y-2">
            <FilterCheckbox 
              id="subject-all" 
              label="Tất cả"
              checked={subjectFilter.includes("all")}
              onChange={() => toggleFilter(subjectFilter, setSubjectFilter, "all")}
            />
            <FilterCheckbox 
              id="subject-math" 
              label="Toán"
              checked={subjectFilter.includes("math")}
              onChange={() => toggleFilter(subjectFilter, setSubjectFilter, "math")}
            />
            <FilterCheckbox 
              id="subject-english" 
              label="Tiếng Anh"
              checked={subjectFilter.includes("english")}
              onChange={() => toggleFilter(subjectFilter, setSubjectFilter, "english")}
            />
            <FilterCheckbox 
              id="subject-vietnamese" 
              label="Tiếng Việt"
              checked={subjectFilter.includes("vietnamese")}
              onChange={() => toggleFilter(subjectFilter, setSubjectFilter, "vietnamese")}
            />
            <FilterCheckbox 
              id="subject-chinese" 
              label="Tiếng Trung"
              checked={subjectFilter.includes("chinese")}
              onChange={() => toggleFilter(subjectFilter, setSubjectFilter, "chinese")}
            />
          </div>
        </FilterSection>

        <FilterSection title="Cuộc thi" defaultOpen={false}>
          <div className="space-y-2">
            <FilterCheckbox 
              id="contest-all" 
              label="Tất cả"
              checked={contestFilter.includes("all")}
              onChange={() => toggleFilter(contestFilter, setContestFilter, "all")}
            />
            <FilterCheckbox 
              id="contest-timo" 
              label="Timo"
              checked={contestFilter.includes("timo")}
              onChange={() => toggleFilter(contestFilter, setContestFilter, "timo")}
            />
            <FilterCheckbox 
              id="contest-tntv" 
              label="Trạng Nguyên Tiếng Việt"
              checked={contestFilter.includes("tntv")}
              onChange={() => toggleFilter(contestFilter, setContestFilter, "tntv")}
            />
            <FilterCheckbox 
              id="contest-vioedu" 
              label="VioEdu"
              checked={contestFilter.includes("vioedu")}
              onChange={() => toggleFilter(contestFilter, setContestFilter, "vioedu")}
            />
          </div>
        </FilterSection>

        <Button variant="gradient" className="w-full mt-4">
          Áp dụng bộ lọc
        </Button>
      </div>
    </aside>
  );
}
