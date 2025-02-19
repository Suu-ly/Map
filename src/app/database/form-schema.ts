import { z } from "zod";

export const vlcFormSchema = z.object({
  class: z.string(),
  sources: z.string(),
  countries: z.string(),
});

export const smtFormSchema = z.object({
  elevation: z.number().array().length(2),
  elevAllowNull: z.boolean(),
  base: z.number().array().length(2),
  baseAllowNull: z.boolean(),
  summit: z.number().array().length(2),
  summitAllowNull: z.boolean(),
  class: z.string(),
  catalogs: z.string(),
});

export const gnssFormSchema = z.object({
  elevation: z.number().array().length(2),
  elevAllowNull: z.boolean(),
  date: z.object({ from: z.date(), to: z.date() }).required(),
  dateAllowNull: z.boolean(),
  projects: z.string(),
  stations: z.string(),
  countries: z.string(),
});

export const fltFormSchema = z.object({
  length: z.number().array().length(2),
  lengthAllowNull: z.boolean(),
  sliprate: z.number().array().length(2),
  sliprateAllowNull: z.boolean(),
  depth: z.number().array().length(2),
  depthAllowNull: z.boolean(),
  types: z.string(),
  catalogs: z.string(),
});

export const seisFormSchema = z.object({
  depth: z.number().array().length(2),
  depthAllowNull: z.boolean(),
  mw: z.number().array().length(2),
  mwAllowNull: z.boolean(),
  date: z.object({ from: z.date(), to: z.date() }).required(),
  dateAllowNull: z.boolean(),
  catalogs: z.string(),
});
