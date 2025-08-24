/**
 * Calculate the XIRR from a list of transactions. XIRR stands for Extended/Internal Rate of Return and is the
 * annualized rate of return for a schedule of cash flows. Mathematically, it's the constant growth rate that makes
 * the net present value (NPV) of all cash flows equal to zero.
 *
 * Intuitively, you can think of this way. You have a list of cash outflows (investments) and inflows (earnings, sales
 * profits, etc) related to some asset. The actual value of the asset may have changed irregularly over the course of
 * time when these transactions have occurred. As the value of the asset fluctuates, the growth rate of the asset
 * changes (e.g., value might have grown by 1% in a day at some point, or value might have dropped by 2% the next
 * day). If you record the growth rate of the asset every day in relation to the previous day, you end up with a list
 * of growth rates such as [0.01, -0.02, -0.01, 0, 0, ...] (arbitrarily chosen numbers here).
 * Let's say the growth was a constant like 0.001, then the list would be [0.001, 0.001, 0.001, 0.001, 0.001, ...].
 * In the latter case, the value of whatever shares you held, increased by 0.1% every day. In reality, this almost never
 * happens, and the growth rate fluctuates from day to day like in the former case. XIRR is looking for a constant
 * growth rate that would yield the same net future value as the actual fluctuating growth rates, given the same
 * list of transactions.
 *
 * An example:
 *
 * Your list of transactions regarding a stock asset:
 * - 1. Buy some shares for $1000 on 2023-Jan-01
 * - 2. Buy some shares for $500 on 2023-Feb-01
 * - 3. Sell some shares for $1320 on 2023-Mar-01
 * - 4. Earn dividends of $100 on 2023-Apr-01
 * - 5. Buy some shares for $2200 on 2023-May-01
 * - 6. Sell all remaining shares for $2651.25 on 2023-Jun-01
 *
 * Looking at actual fluctuations in the stock asset's value over time:
 * - 1. At 2023-Jan-01, value per share was $1, you bought 1000 shares for $1000.
 *      Shares balance 1000 (value $1000), cash balance -1000.
 * - 2. At 2023-Feb-01, value per share was $0.8, you bought 625 shares for $500.
 *      Shares balance 1625 (value $1300), cash balance -1500.
 * - 3. At 2023-Mar-01, value per share was $1.2, you sold 1100 shares for $1320.
 *      Shares balance 525 (value $630), cash balance -180.
 * - 4. At 2023-Apr-01, you earned dividends of $100.
 *      Shares balance 525, cash balance -80.
 * - 5. At 2023-May-01, value per share was $1.1, you bought 2000 shares for $2200.
 *      Shares balance 2525 (value $2777.5), cash balance -2280.
 * - 6. At 2023-Jun-01, value per share was $1.05, you sold all remaining 2525 shares for $2651.25.
 *      Shares balance 0 (value $0), cash balance 371.25.
 *
 * For this list of transactions, the XIRR is 1.159266424. If the stock price had a constant yearly growth rate of this
 * value instead of the actual fluctuating values, then the net outcome from carrying out the same transactions, would
 * also result in a final cash balance of $371.25.
 *
 * Here's the proof:
 *
 * For a yearly (365 days) growth rate of 1.159266424, the equivalent daily growth rate is 1.00211118. Let's simulate
 * the outcome of applying the same transactions to a stock with a constant daily growth rate of this value.
 * Note: XIRR doesn't consider the amount of held shares, only the cash flows. So let's omit the shares balance and
 * the share price which would make it more confusing.
 *
 * - 1. At 2023-Jan-01 you invested $1000.
 *      Value of shares $1000, cash balance -1000.
 * - 2. At 2023-Feb-01 (31 days later) you invested $500.
 *      Existing value of held shares has increased to 1067.562062 (multiplied by 1.00211118 ^ 31).
 *      Total value of held shares is now 1567.562062, cash balance -1500.
 * - 3. At 2023-Mar-01 (28 days later) you withdrew $1320.
 *      Existing value of held shares has increased to 1662.9153945 (multiplied by 1.00211118 ^ 28).
 *      Total value of held shares is now 342.9153945, cash balance -180.
 * - 4. At 2023-Apr-01 (31 days later) you withdrew $100.
 *      Existing value of held shares has increased to 366.0834658 (multiplied by 1.00211118 ^ 31).
 *      Total value of held shares is now 266.0834658, cash balance -80.
 * - 5. At 2023-May-01 (30 days later) you invested $2200.
 *      Existing value of held shares has increased to 283.4621737 (multiplied by 1.00211118 ^ 30).
 *      Total value of held shares is now 2483.4621737, cash balance -2280.
 * - 6. At 2023-Jun-01 (31 days later) you withdrew $2651.25.
 *      Existing value of held shares has increased to 2651.25 (multiplied by 1.00211118 ^ 31).
 *      Total value of held shares is now 0, cash balance 371.25.
 *
 * As a result, the final profit is 371.25, whether the invested money grew at a fluctuating rate, or at a constant
 * rate. This is what XIRR aims to simulate. The asset type and the number of shares held is irrelevant. The same
 * cash flows could represent a fund investment, a rental apartment investment, etc. We see the average growth rate
 * and profitability of the asset over time, and this way can compare assets of different types, sizes, durations, and
 * cash flow dynamics.
 *
 * @param transactions { [ {cashFlow: number, time: Date} ]} - A list of transactions where each transaction represents
 *     a cash inflow or outflow of an asset and the time when it was made. The given time is first converted to a
 *     local time, and then only the date part is kept (exact time ignored).
 *     Must contain at least one positive and one negative cash flow.
 * @returns {number} - The XIRR of the asset or NaN if the calculation ran out of budget.
 */
function xirr(transactions) {
    if (!Array.isArray(transactions)) {
        throw new Error(`Invalid transactions: ${transactions}`);
    }
    let hasPositiveCashFlow = false;
    let hasNegativeCashFlow = false;
    transactions.forEach(transaction => {
        if (typeof transaction.cashFlow !== 'number' || isNaN(transaction.cashFlow) || !isFinite(transaction.cashFlow)) {
            throw new Error(`Invalid transaction.cashFlow: ${transaction.cashFlow}`);
        }
        if (!(transaction.time instanceof Date)) {
            throw new Error(`Invalid transaction.time: ${transaction.time}`);
        }
        if (transaction.cashFlow < 0) {
            hasNegativeCashFlow = true;
        }
        if (transaction.cashFlow > 0) {
            hasPositiveCashFlow = true;
        }
    });
    if (!hasPositiveCashFlow || !hasNegativeCashFlow) {
        throw new Error(`Invalid transactions: must contain at least one positive and one negative cash flow`);
    }

    // Convert transactions with timestamps to transactions with day differences.
    const firstDate = transactions[0].time;
    transactions = transactions.map(transaction => ({
        amount: transaction.cashFlow,
        days: countDays(firstDate, transaction.time)
    }));

    // Begin by binary search in the positive domain.
    return findAnyRoot(
        -0.02, +0.02,
        10_000, 0.0000001,
        (r) => simulateNetFutureValue(transactions, r)
    );

    // let dailyGrowthRate = 0.01;
    // let binarySearch = new BinarySearch(dailyGrowthRate, dailyGrowthRate);
    // let dailyGrowthRate = 0.02;
    // let step = 0.01;
    // let lastNfv = 0.0;
    // let lowerBound = -1.0;
    // let upperBound = 9999999999999999999999999.9;
    // const stepCoefficient = 1.25;
    // const minStep = 0.00000000000001;
    // const maxStep = 1000.0;
    // const minAbsNfv = 0.0000001;
    //
    // // Iterate until the guess converges.
    // for (let i = 0; i < 1000; ++i) {
    //     const nfv = simulateNetFutureValue(transactions, dailyGrowthRate);
    //     // End condition
    //     if (nfv === 0.0 || Math.abs(nfv) < minAbsNfv) {
    //         return Math.pow(dailyGrowthRate, 365) - 1.0;
    //     }
    //     // Faulty end condition
    //     if (Math.abs(step) < minStep) {
    //         throw new Error(`Step too small on iteration ${i}: ${step}`);
    //     }
    //     if (Math.abs(step) > maxStep) {
    //         throw new Error(`Step too large on iteration ${i}: ${step}`);
    //     }
    //     // Check which direction and how much we should move.
    //     const isFirstStep = i === 0;
    //     const signChanged = lastNfv * nfv < 0.0;
    //     const distanceIncreased = Math.abs(nfv) > Math.abs(lastNfv);
    //     const distanceSame = Math.abs(nfv) === Math.abs(lastNfv);
    //
    //     if (isFirstStep) {
    //         // Start off with a small positive step.
    //         step = 0.5;
    //     } else if (signChanged || distanceIncreased) {
    //         // Move a smaller step in the opposite direction.
    //         step /= -stepCoefficient;
    //     } else if (distanceSame) {
    //         // Move a bigger step in the positive direction. Most likely, we are stuck in negative territory.
    //         // Forbid moving into the negative territory again to avoid getting stuck in a loop.
    //         if (dailyGrowthRate < 0) {
    //             lowerBound = Math.max(dailyGrowthRate, dailyGrowthRate - step);
    //         }
    //         step = Math.abs(step * stepCoefficient);
    //     } else if (Math.abs(nfv) > Math.abs(lastNfv) * 0.5) {
    //         // If the step got us less than 50% closer, take a bigger step in the same direction.
    //         step *= stepCoefficient;
    //     } else {
    //         // Take a smaller step in the same direction. We are quite sure of the direction now, so we can forbid
    //         // moving further than the previous value.
    //         if (step < 0) {
    //             upperBound = dailyGrowthRate
    //         } else {
    //             lowerBound = Math.max(dailyGrowthRate, dailyGrowthRate - step);
    //         }
    //         step /= stepCoefficient;
    //     }
    //     // Update the guess.
    //     dailyGrowthRate += step;
    //     if (dailyGrowthRate <= -1.0) {
    //         throw new Error(`Growth rate too small: ${dailyGrowthRate}`)
    //     }
    //     if (dailyGrowthRate < lowerBound) {
    //         dailyGrowthRate = lowerBound;
    //     }
    //     lastNfv = nfv;
    // }
    //
    // // Begin by guessing the minimum possible growth rate of -99.999999999%.
    // let dailyGrowthRate = -0.99999999999;
    // let step = 0.1;
    // let lastNfv = 0.0;
    // let lowerBound = -1.0;
    // let upperBound = 9999999999999999999999999.9;
    // const stepCoefficient = 1.25;
    // const minStep = 0.00000000000001;
    // const maxStep = 1000.0;
    // const minAbsNfv = 0.0000001;
    //
    // // Iterate until the guess converges.
    // for (let i = 0; i < 1000; ++i) {
    //     const nfv = simulateNetFutureValue(transactions, dailyGrowthRate);
    //     // End condition
    //     if (nfv === 0.0 || Math.abs(nfv) < minAbsNfv) {
    //         return Math.pow(dailyGrowthRate, 365) - 1.0;
    //     }
    //     // Faulty end condition
    //     if (Math.abs(step) < minStep) {
    //         throw new Error(`Step too small on iteration ${i}: ${step}`);
    //     }
    //     if (Math.abs(step) > maxStep) {
    //         throw new Error(`Step too large on iteration ${i}: ${step}`);
    //     }
    //     // Check which direction and how much we should move.
    //     const isFirstStep = i === 0;
    //     const signChanged = lastNfv * nfv < 0.0;
    //     const distanceIncreased = Math.abs(nfv) > Math.abs(lastNfv);
    //     const distanceSame = Math.abs(nfv) === Math.abs(lastNfv);
    //
    //     if (isFirstStep) {
    //         // Start off with a small positive step.
    //         step = 0.5;
    //     } else if (signChanged || distanceIncreased) {
    //         // Move a smaller step in the opposite direction.
    //         step /= -stepCoefficient;
    //     } else if (distanceSame) {
    //         // Move a bigger step in the positive direction. Most likely, we are stuck in negative territory.
    //         // Forbid moving into the negative territory again to avoid getting stuck in a loop.
    //         if (dailyGrowthRate < 0) {
    //             lowerBound = Math.max(dailyGrowthRate, dailyGrowthRate - step);
    //         }
    //         step = Math.abs(step * stepCoefficient);
    //     } else if (Math.abs(nfv) > Math.abs(lastNfv) * 0.5) {
    //         // If the step got us less than 50% closer, take a bigger step in the same direction.
    //         step *= stepCoefficient;
    //     } else {
    //         // Take a smaller step in the same direction. We are quite sure of the direction now, so we can forbid
    //         // moving further than the previous value.
    //         if (step < 0) {
    //             upperBound = dailyGrowthRate
    //         } else {
    //             lowerBound = Math.max(dailyGrowthRate, dailyGrowthRate - step);
    //         }
    //         step /= stepCoefficient;
    //     }
    //     // Update the guess.
    //     dailyGrowthRate += step;
    //     if (dailyGrowthRate <= -1.0) {
    //         throw new Error(`Growth rate too small: ${dailyGrowthRate}`)
    //     }
    //     if (dailyGrowthRate < lowerBound) {
    //         dailyGrowthRate = lowerBound;
    //     }
    //     lastNfv = nfv;
    // }
    //
    // throw new Error(`XIRR calculation failed after 1000 iterations`);
}

/**
 * Convert a list of dates to a list of day differences.
 * The first date is considered day 0, all the following dates relative to it.
 * @param dates {Date[]} - The list of dates to convert.
 * @returns {number[]} - The list of day differences relative to the first date.
 */
function datesToDayDiffs(dates) {
    // Check
    if (!Array.isArray(dates)) {
        throw new Error(`Invalid dates: ${dates}`);
    }
    // Check all dates are valid
    dates.forEach(date => {
        if (!(date instanceof Date)) {
            throw new Error(`Invalid date: ${date}`);
        }
    });
    if (dates.length === 0) {
        return [];
    }
    const firstDate = dates[0];
    return dates.map(date => countDays(firstDate, date));
}

/**
 * Starting with a balance of 0 and given a list of timed transactions and a constant daily growth rate, calculate the
 * net future value of an asset.
 * @param transactions { [ { amount: number, days: number } ] } - A list of timed transactions where each transaction
 *     represents a change to the current value of the asset after a certain number of days from start.
 * @param growthRate {number} - The constant daily growth rate of the asset (e.g., 0.01 for 1%).
 * @returns {number} - The net future value of the asset immediately after the last transaction.
 */
function simulateNetFutureValue(transactions, growthRate) {
    if (!Array.isArray(transactions)) {
        throw new Error(`Invalid transactions: ${transactions}`);
    }
    transactions.forEach(transaction => {
        if (typeof transaction.amount !== 'number' || isNaN(transaction.amount) || !isFinite(transaction.amount)) {
            throw new Error(`Invalid transaction.amount: ${transaction.amount}`);
        }
        if (typeof transaction.days !== 'number' || isNaN(transaction.days) || !isFinite(transaction.days)) {
            throw new Error(`Invalid transaction.days: ${transaction.days}`);
        }
        if (transaction.days < 0) {
            throw new Error(`Invalid transaction.days: ${transaction.days}`);
        }
    });
    if (typeof growthRate !== 'number' || isNaN(growthRate) || !isFinite(growthRate)) {
        throw new Error(`Invalid growthRate: ${growthRate}`);
    }
    if (growthRate <= -1.0) {
        // The minimum growth rate is -100%. Even exactly -100% doesn't really make sense.
        throw new Error(`Growth rate too small: ${growthRate}`)
    }
    // Sort chronologically
    transactions = transactions.sort((a, b) => a.days - b.days);
    // Start off with balance 0 on day 0
    let balance = 0.0;
    let day = 0;
    // Simulate
    transactions.forEach(transaction => {
        let daysPassed = transaction.days - day;
        if (daysPassed < 0) {
            throw new Error(`daysPassed negative`);
        }
        if (daysPassed > 0) {
            balance = simulateFutureValue(balance, growthRate, daysPassed);
        }
        balance += transaction.amount;
        day = transaction.days;
    });
    return balance;
}

/**
 * Given the current value of an asset, a daily growth rate, and a number of days, calculate the
 * future value of the asset.
 * @param currentValue {number} - The current value of the asset.
 * @param growthRate {number} - The daily growth rate of the asset (e.g., 0.01 for 1%).
 * @param days {number} - The number of days to calculate the future value for.
 * @returns {number} - The future value of the asset.
 */
function simulateFutureValue(currentValue, growthRate, days) {
    if (typeof currentValue !== 'number' || isNaN(currentValue) || !isFinite(currentValue)) {
        throw new Error(`Invalid currentValue: ${currentValue}`);
    }
    if (typeof growthRate !== 'number' || isNaN(growthRate) || !isFinite(growthRate)) {
        throw new Error(`Invalid growthRate: ${growthRate}`);
    }
    if (growthRate <= -1.0) {
        // The minimum growth rate is -100%. Even exactly -100% doesn't really make sense.
        throw new Error(`Growth rate too small: ${growthRate}`)
    }
    if (typeof days !== 'number' || isNaN(days) || !isFinite(days)) {
        throw new Error(`Invalid days: ${days}`);
    }
    if (days <= 0) {
        throw new Error(`Invalid days: ${days}`);
    }
    const futureValue = currentValue * Math.pow(1 + growthRate, days);
    if (isNaN(futureValue) || !isFinite(futureValue)) {
        throw new Error(`Invalid futureValue: ${futureValue}`);
    }
    return futureValue;
}
