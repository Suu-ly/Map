import {
  ActionReturn,
  LoadFlt,
  LoadGNSS,
  LoadHf,
  LoadSeis,
  LoadSlab2,
  LoadSlip,
  LoadSmt,
  LoadVlc,
} from "@/server/actions";
import { clsx, type ClassValue } from "clsx";
import { MultiPolygon, Polygon } from "geojson";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import { ALL_FILTERS, createZodSchema } from "./filters";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const velocityStops = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

// Used for displaying the message on the toast when loading data
export const TOAST_MESSAGE: Record<keyof typeof ALL_FILTERS, string> = {
  flt: "faults",
  gnss: "GNSS stations",
  hf: "heatflow data",
  seis: "seismic data",
  slab2: "slab data",
  smt: "seamounts",
  vlc: "volcanoes",
  slip: "slip model data",
};

// Labels used for the data select component
export const DATA_LABELS: Record<keyof typeof ALL_FILTERS, string> = {
  smt: "Seamounts",
  vlc: "Volcanoes",
  gnss: "GNSS Stations",
  flt: "Faults",
  seis: "Seismic",
  hf: "Heatflow",
  slab2: "Slab",
  slip: "Slip Models",
};

// Server actions used to load the data
export const LOADERS: Record<
  keyof typeof ALL_FILTERS,
  | ((
      values: z.infer<z.ZodObject<ReturnType<typeof createZodSchema>>>,
      drawing?: MultiPolygon | Polygon,
    ) => Promise<ActionReturn>)
  | ((drawing?: MultiPolygon | Polygon) => Promise<ActionReturn>)
> = {
  smt: LoadSmt,
  vlc: LoadVlc,
  gnss: LoadGNSS,
  flt: LoadFlt,
  seis: LoadSeis,
  hf: LoadHf,
  slab2: LoadSlab2,
  slip: LoadSlip,
};
