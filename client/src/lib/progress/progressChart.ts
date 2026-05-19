import { DateTime } from 'luxon';
import _ from 'lodash'

import { Track } from '@/lib/Track'
import type { TracksByYearDict, ExtendedPChartDataPoint, DSet, PChartSortType } from '@/lib/progress/progressChartTypes'


/**
 * Converts yearly track data into Chart.js line datasets, calculating
 * cumulative distance for each year with dates normalized to 2024 for comparison.
 * @param tracksByYear Dictionary mapping years to arrays of Track objects
 * @param maxSortType Determines whether to prioritize newest years or highest progress when limiting datasets
 * @param maxLines Maximum number of datasets (years) to include in the output. Set to 0 for no limit.
 * @returns Array of Chart.js datasets with cumulative distance data, larger point radius for the most recent year
 */
function generateChartDataSets(tracksByYear: TracksByYearDict, maxSortType: PChartSortType = 'newest_year', maxLines = 0): DSet[] {

  const yearList = _.keys(tracksByYear).map((ys) => Number.parseInt(ys))
  yearList.sort().reverse()

  const maxYear = Math.max(...yearList)

  const yearListToUse: number[] = []

  // Cut down list of years to use based on sorting preference and max lines
  if (maxSortType === 'newest_year') {
    yearListToUse.push(...yearList.slice(0, maxLines === 0 ? yearList.length : maxLines))

  } else if (maxSortType === 'highest_progress') {
    yearListToUse.push(...yearList) // filtering is later
  }

  const progressYearPairs: { year: number, progress: number }[] = [] // for ranking by progress if needed
  const dataSetByYear: Record<number, DSet> = {} // for easy lookup when sorting by progress

  for (const year of yearListToUse) {

    if ((tracksByYear[year] === undefined) || tracksByYear[year].length === 0) continue

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
    const chartData: ExtendedPChartDataPoint[] = sortedValidTracks.map(
      (t: Track) => {
        const step = t.distance() / 1000
        sum += step

        const trackDate = t.getTime() as DateTime<true>
        const normDate = trackDate.set({ year: 2024 })
        return {
          x: normDate, y: sum, step, name: t.getNameOrSrc(), originalDate: trackDate
        }
      }
    )

    const totalProgress = chartData.at(-1)?.y ?? 0 // can not happen 
    progressYearPairs.push({ year, progress: totalProgress })

    // Label below is for whole dataset, not individual points
    const dataset: DSet = {
      label: year.toString(),
      data: chartData,
      pointRadius: (year === maxYear) ? 5 : 3
    }

    dataSetByYear[year] = dataset
    //returnDataSetList.push(dataset)

  }

  const returnDataSetList: DSet[] = []
  if (maxSortType === 'newest_year') {
    // Return datasets for the newest years
    for (const year of yearListToUse) {
      returnDataSetList.push(dataSetByYear[year]!)
    }
  } else if (maxSortType === 'highest_progress') {
    // Sort years by progress and return datasets for the top years
    progressYearPairs.sort((a, b) => b.progress - a.progress)
    const topYears = progressYearPairs.slice(0, maxLines).map(p => p.year)

    // check if min 1 year, then check if current year is in top years, if not add it to the list (for visual comparison)
    if (topYears.length > 0 && !topYears.includes(maxYear)) {
      topYears.push(maxYear)
    }

    // sort them again by year for better visual comparison
    topYears.sort().reverse()
    for (const year of topYears) {
      returnDataSetList.push(dataSetByYear[year]!)
    }
  }

  return returnDataSetList
}

/**
 * State of both buttons, for now only one can be active at a time, but maybe in the future we want to allow both to be active at the same time. 
 * Will also print classes for active/inactive state of buttons, so that they can be styled accordingly.
 *  */
class FilterButtonState {
  newestActive: boolean
  bestActive: boolean

  constructor() {
    this.newestActive = false
    this.bestActive = false
  }

  toggleNewest() {
    this.newestActive = !this.newestActive
    if (this.newestActive) {
      this.bestActive = false
    }
  }

  toggleBest() {
    this.bestActive = !this.bestActive
    if (this.bestActive) {
      this.newestActive = false
    }
  }

  filterActive(): boolean {
    return this.newestActive || this.bestActive
  }

  newestButtonClass() {
    return FilterButtonState.activeClass(this.newestActive)
  }

  bestButtonClass() {
    return FilterButtonState.activeClass(this.bestActive)
  }

  static activeClass(active: boolean) {
    return active ? "btn-secondary" : "btn-outline-secondary"
  }
}

export { generateChartDataSets, FilterButtonState }