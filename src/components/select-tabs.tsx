import {
  ComponentProps,
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const SelectTabsContext = createContext<string | undefined>(undefined);

const SelectTabs = (props: ComponentProps<typeof Select>) => {
  const [value, setValue] = useState<string>();

  return (
    <SelectTabsContext.Provider value={value}>
      <Select {...props} value={value} onValueChange={setValue} />
    </SelectTabsContext.Provider>
  );
};

const SelectTabsTrigger = SelectTrigger;

const SelectTabsValue = SelectValue;

const SelectTabsContent = SelectContent;

const SelectTabsItem = SelectItem;

const SelectTabsTab = ({
  value,
  children,
}: {
  value: string;
  children: ReactNode;
}) => {
  const currentValue = useContext(SelectTabsContext);
  // Maintain the state when switching to other tabs
  return (
    <div className={currentValue !== value ? "hidden" : ""}>{children}</div>
  );
};

export {
  SelectTabs,
  SelectTabsContent,
  SelectTabsItem,
  SelectTabsTab,
  SelectTabsTrigger,
  SelectTabsValue,
};
