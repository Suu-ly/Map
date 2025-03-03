"use server";

import {
  fltFilters,
  fltFormSchema,
  gnssFilters,
  gnssFormSchema,
  seisFilters,
  seisFormSchema,
  smtFilters,
  smtFormSchema,
  vlcFilters,
  vlcFormSchema,
} from "@/lib/filters";
import { FilterDefine, GenericFiltersInfo } from "@/lib/types";
import { and, between, eq, isNull, or, type SQL, sql } from "drizzle-orm";
import { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { z } from "zod";
import { db } from "./db";
import {
  biblInInvest,
  countryInInvest,
  fltInInvest,
  gnssStnInInvest,
  heatflowInInvest,
  seisInInvest,
  smtInInvest,
  stnTypeInInvest,
  vlcInInvest,
} from "./db/schema";

const sqlToGeojson = (
  input: {
    id: number;
    geojson: string;
    [key: string]: string | number | null | Date;
  }[],
): FeatureCollection => {
  const features: Feature[] = [];
  for (let i = 0; i < input.length; i++) {
    features.push({
      type: "Feature",
      id: input[i].id,
      properties: {
        ...input[i],
        geojson: undefined,
        id: undefined,
      },
      geometry: JSON.parse(input[i].geojson),
    });
  }
  return {
    type: "FeatureCollection",
    features: features,
  };
};

type ReturnType =
  | { success: false; error: string }
  | { success: true; data: FeatureCollection };

const generateFilters = (
  filters: FilterDefine<GenericFiltersInfo>,
  values: {
    [x: string]:
      | string
      | boolean
      | number[]
      | {
          from: Date;
          to: Date;
        };
  },
) => {
  const output: (SQL | undefined)[] = [];
  Object.entries(filters).map(([key, filter]) => {
    if (filter.type === "select") {
      if (values[key] !== "All") {
        if (values[key] === "NULL" && filter.nullCol) {
          output.push(isNull(filter.nullCol));
        } else {
          output.push(eq(filter.dbCol, values[key]));
        }
      }
    }
    if (filter.type === "range" && Array.isArray(values[key])) {
      if (values[`${key}AllowNull`]) {
        output.push(
          or(
            between(filter.dbCol, values[key][0], values[key][1]),
            isNull(filter.dbCol),
          ),
        );
      } else {
        output.push(between(filter.dbCol, values[key][0], values[key][1]));
      }
    }
    if (
      filter.type === "date" &&
      typeof values[key] === "object" &&
      !Array.isArray(values[key])
    ) {
      if (values[`${key}AllowNull`]) {
        output.push(
          or(
            between(
              filter.dbCol,
              values[key].from.toISOString(),
              values[key].to.toISOString(),
            ),
            isNull(filter.dbCol),
          ),
        );
      } else {
        output.push(
          between(
            filter.dbCol,
            values[key].from.toISOString(),
            values[key].to.toISOString(),
          ),
        );
      }
    }
  });
  return output;
};

export const LoadSmt = async (
  values: z.infer<typeof smtFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ReturnType> => {
  const { success } = smtFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(smtFilters, values);
  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${smtInInvest.smtGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  const data = await db
    .select({
      id: smtInInvest.smtId,
      name: smtInInvest.smtName,
      class: smtInInvest.smtClass,
      elevation: smtInInvest.smtElev,
      base: smtInInvest.smtBase,
      summit: smtInInvest.smtSummit,
      bw: smtInInvest.smtBw,
      ba: smtInInvest.smtBa,
      bl: smtInInvest.smtBl,
      longitude: smtInInvest.smtLon,
      latitude: smtInInvest.smtLat,
      geojson: sql<string>`ST_ASGEOJSON(${smtInInvest.smtGeom})`,
    })
    .from(smtInInvest)
    .leftJoin(biblInInvest, eq(smtInInvest.smtSrcId, biblInInvest.biblId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadVlc = async (
  values: z.infer<typeof vlcFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ReturnType> => {
  const { success } = vlcFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(vlcFilters, values);
  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${vlcInInvest.vlcGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  const data = await db
    .select({
      id: vlcInInvest.vlcId,
      name: vlcInInvest.vlcName,
      elevation: vlcInInvest.vlcElev,
      class: vlcInInvest.vlcClass,
      categorySource: vlcInInvest.vlcCatSrc,
      country: countryInInvest.countryName,
      gvpId: vlcInInvest.gvpId,
      wovodat: vlcInInvest.vlcWovodatUrl,
      gvp: vlcInInvest.vlcGvpUrl,
      longitude: vlcInInvest.vlcLon,
      latitude: vlcInInvest.vlcLat,
      geojson: sql<string>`ST_ASGEOJSON(${vlcInInvest.vlcGeom})`,
    })
    .from(vlcInInvest)
    .leftJoin(
      countryInInvest,
      eq(vlcInInvest.countryId, countryInInvest.countryId),
    )
    .leftJoin(biblInInvest, eq(vlcInInvest.vlcSrcId, biblInInvest.biblId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadGNSS = async (
  values: z.infer<typeof gnssFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ReturnType> => {
  const { success } = gnssFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(gnssFilters, values);
  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${gnssStnInInvest.gnssGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  const data = await db
    .select({
      id: gnssStnInInvest.gnssId,
      name: gnssStnInInvest.gnssName,
      project: gnssStnInInvest.gnssProj,
      type: stnTypeInInvest.stnTypeName,
      elevation: gnssStnInInvest.gnssElev,
      country: countryInInvest.countryName,
      installDate: gnssStnInInvest.gnssInstDate,
      decomDate: gnssStnInInvest.gnssDecomDate,
      longitude: gnssStnInInvest.gnssLon,
      latitude: gnssStnInInvest.gnssLat,
      geojson: sql<string>`ST_ASGEOJSON(${gnssStnInInvest.gnssGeom})`,
    })
    .from(gnssStnInInvest)
    .leftJoin(
      countryInInvest,
      eq(gnssStnInInvest.countryId, countryInInvest.countryId),
    )
    .leftJoin(
      stnTypeInInvest,
      eq(stnTypeInInvest.stnTypeId, gnssStnInInvest.stnTypeId),
    )
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadFlt = async (
  values: z.infer<typeof fltFormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ReturnType> => {
  const { success } = fltFormSchema.safeParse(values);
  console.log(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(fltFilters, values);

  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${fltInInvest.fltGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  const data = await db
    .select({
      id: fltInInvest.fltId,
      name: fltInInvest.fltName,
      segmentName: fltInInvest.fltSegName,
      type: fltInInvest.fltType,
      length: fltInInvest.fltLen,
      sliprate: fltInInvest.fltSliprate,
      ss: fltInInvest.fltSs,
      verticalSeparation: fltInInvest.fltVertSep,
      horizontalSeparation: fltInInvest.fltHorzSep,
      dip: fltInInvest.fltDip,
      rake: fltInInvest.fltRake,
      maxm: fltInInvest.fltMaxm,
      cmt: fltInInvest.fltCmt,
      lockdepth: fltInInvest.fltLockDepth,
      catalog: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${fltInInvest.fltGeom})`,
    })
    .from(fltInInvest)
    .leftJoin(biblInInvest, eq(fltInInvest.fltSrcId, biblInInvest.biblId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadSeis = async (
  values: z.infer<typeof seisFormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ReturnType> => {
  const { success } = seisFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(seisFilters, values);

  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${seisInInvest.seisGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  const data = await db
    .select({
      id: seisInInvest.seisId,
      depth: seisInInvest.seisDepth,
      mw: seisInInvest.seisMw,
      ms: seisInInvest.seisMs,
      mb: seisInInvest.seisMb,
      catalog: biblInInvest.biblTitle,
      date: seisInInvest.seisDate,
      longitude: seisInInvest.seisLon,
      latitude: seisInInvest.seisLat,
      geojson: sql<string>`ST_ASGEOJSON(${seisInInvest.seisGeom})`,
    })
    .from(seisInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, seisInInvest.seisCatId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadHf = async (
  drawing?: MultiPolygon | Polygon,
): Promise<ReturnType> => {
  let filters;
  if (drawing) {
    filters = sql`ST_INTERSECTS(${heatflowInInvest.hfGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`;
  }

  const data = await db
    .select({
      id: heatflowInInvest.hfId,
      name: heatflowInInvest.hfName,
      elevation: heatflowInInvest.hfElev,
      qval: heatflowInInvest.hfQval,
      reference: heatflowInInvest.hfRef,
      longitude: heatflowInInvest.hfLon,
      latitude: heatflowInInvest.hfLat,
      geojson: sql<string>`ST_ASGEOJSON(${heatflowInInvest.hfGeom})`,
    })
    .from(heatflowInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, heatflowInInvest.hfSrcId))
    .where(filters);
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};
