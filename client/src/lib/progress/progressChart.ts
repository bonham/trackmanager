import { DateTime } from 'luxon';
import _ from 'lodash'

import { Track } from '@/lib/Track'

type TracksByYearDict = Record<number, Track[]>;

interface ChartDataPoint {
  x: DateTime<true>,
  y: number,
  name: string,
  step: number,
  originalDate: DateTime<true>
}

interface DSet {
  label: string,
  data: ChartDataPoint[],
  pointRadius: number
}

/**
 * Converts yearly track data into Chart.js line datasets, calculating
 * cumulative distance for each year with dates normalized to 2024 for comparison.
 * @param tracksByYear Dictionary mapping years to arrays of Track objects
 * @returns Array of Chart.js datasets with cumulative distance data, larger point radius for the most recent year
 */
function generateChartDataSets(tracksByYear: TracksByYearDict) {

  const yearList = _.keys(tracksByYear).map((ys) => Number.parseInt(ys))
  yearList.sort().reverse()

  const maxYear = Math.max(...yearList)

  // Add one dataset per year, with cumulative distance and normalized dates for comparison
  const returnDataSetList: DSet[] = []
  for (const year of yearList) {

    if (tracksByYear[year] !== undefined) {

      // Clean and sort tracks for the year
      const sortedValidTracks: Track[] = []
      for (const track of tracksByYear[year]) {

        const tTime = track.getTime()

        if (tTime?.isValid) {
          sortedValidTracks.push(track)
        }
        sortedValidTracks.sort((a, b) => (a.getTime()!.toSeconds() - b.getTime()!.toSeconds()))
      }

      // map tracks to dataset structure with cumulative distance, normalizing dates to 2024 for comparison across years
      let sum = 0
      const chartData: ChartDataPoint[] = sortedValidTracks.map(
        (t: Track) => {
          const step = t.distance() / 1000
          sum += step

          const trackDate = t.getTime() as DateTime<true>
          const normDate = trackDate.set({ year: 2024 })
          return {
            x: normDate, y: sum, step, name: t.getNameOrSrc(), originalDate: trackDate
          }
        })

      // Label below is for whole dataset, not individual points
      const dataset: DSet = {
        label: year.toString(),
        data: chartData,
        pointRadius: (year === maxYear) ? 5 : 3
      }

      returnDataSetList.push(dataset)
    }
  }
  return returnDataSetList
}

export { generateChartDataSets, type TracksByYearDict, type ChartDataPoint, type DSet }