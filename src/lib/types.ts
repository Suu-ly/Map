import { AnyPgColumn } from "drizzle-orm/pg-core";

export type BasemapNames =
  | "Openstreetmap"
  | "Opentopomap"
  | "Satellite"
  | "Ocean"
  | "Openfreemap";

export type Range = [number, number];
export type Categories = string[] | null;
export type DateFilter = readonly [string, string];
// Generic type of the data that describes the filter values
export type GenericFiltersInfo = Record<
  string,
  Range | Categories | DateFilter
>;

// Information needed to generate the form depending on the type of filter it is
export type FiltersType =
  | {
      name: string;
      type: "select";
      dbCol: AnyPgColumn;
      nullCol: AnyPgColumn;
    }
  | {
      name: string;
      type: "range";
      dbCol: AnyPgColumn;
      units?: string;
    }
  | {
      name: string;
      type: "date";
      dbCol: AnyPgColumn;
    };
// Type for the filters definition
export type FilterDefine<T extends GenericFiltersInfo> = {
  [P in keyof T]: T[P] extends Range
    ? Extract<FiltersType, { type: "range" }>
    : T[P] extends Categories
      ? Extract<FiltersType, { type: "select" }>
      : T[P] extends DateFilter
        ? Extract<FiltersType, { type: "date" }>
        : {
            name: string;
            type: "select" | "range" | "date";
            dbCol: AnyPgColumn;
            nullCol?: AnyPgColumn;
            units?: string;
          };
};
