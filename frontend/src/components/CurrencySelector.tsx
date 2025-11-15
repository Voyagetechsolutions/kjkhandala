import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/contexts/CurrencyContext";
import { getAllCurrencies, type Currency } from "@/lib/currency";

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const currencies = getAllCurrencies();
  const currentCurrency = currencies.find(c => c.code === currency);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <span>{currentCurrency?.flag}</span>
          <span>{currentCurrency?.symbol}</span>
          <span>{currentCurrency?.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => setCurrency(curr.code as Currency)}
            className="gap-2"
          >
            <span>{curr.flag}</span>
            <span>{curr.symbol}</span>
            <span>{curr.name}</span>
            {currency === curr.code && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
