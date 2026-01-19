import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface ThemePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentColor: string | null;
  onSelectColor: (color: string | null) => void;
  title?: string;
}

const THEME_COLORS = [
  { name: "Padrão", value: null, gradient: "linear-gradient(135deg, hsl(16 90% 55%) 0%, hsl(35 95% 55%) 100%)" },
  { name: "Coral", value: "coral", gradient: "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)" },
  { name: "Roxo", value: "purple", gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
  { name: "Azul", value: "blue", gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
  { name: "Verde", value: "green", gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" },
  { name: "Rosa", value: "pink", gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
  { name: "Dourado", value: "gold", gradient: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)" },
  { name: "Teal", value: "teal", gradient: "linear-gradient(135deg, #11998e 0%, #0f3443 100%)" },
  { name: "Vermelho", value: "red", gradient: "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)" },
];

const ThemePickerModal = ({
  open,
  onOpenChange,
  currentColor,
  onSelectColor,
  title = "Escolher Tema",
}: ThemePickerModalProps) => {
  const handleSelect = (value: string | null) => {
    onSelectColor(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          {THEME_COLORS.map((color) => (
            <button
              key={color.value || "default"}
              onClick={() => handleSelect(color.value)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent transition-colors"
            >
              <div
                className="w-12 h-12 rounded-full relative flex items-center justify-center shadow-lg"
                style={{ background: color.gradient }}
              >
                {currentColor === color.value && (
                  <Check className="w-6 h-6 text-white drop-shadow-md" />
                )}
              </div>
              <span className="text-xs font-medium">{color.name}</span>
            </button>
          ))}
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => onOpenChange(false)}
        >
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default ThemePickerModal;

export const getThemeGradient = (color: string | null): string => {
  const theme = THEME_COLORS.find(t => t.value === color);
  return theme?.gradient || THEME_COLORS[0].gradient;
};
