import { DateTime } from "luxon";
import { Track } from "@/lib/Track";

type TracksByYearDict = Record<number, Track[]>;

type PChartTType = 'line'
interface PChartDataPoint { x: DateTime<true>; y: number; }
type PChartTLabel = DateTime


interface ExtendedPChartDataPoint extends PChartDataPoint {
  name: string,
  step: number,
  originalDate: DateTime<true>
}

interface DSet {
  label: string,
  data: ExtendedPChartDataPoint[],
  pointRadius: number
}

type PChartSortType = 'newest_year' | 'highest_progress'

export type { TracksByYearDict, ExtendedPChartDataPoint, DSet, PChartTType, PChartDataPoint, PChartTLabel, PChartSortType }