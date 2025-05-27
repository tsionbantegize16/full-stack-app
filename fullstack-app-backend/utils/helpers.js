const { parse, differenceInMinutes } = require('date-fns');

/**
 * Calculates the difference in hours between two time strings (HH:mm).
 * Handles overnight shifts by adding 24 hours if finish_time is earlier than start_time.
 * @param {string} startTimeStr - Start time in HH:mm format.
 * @param {string} finishTimeStr - Finish time in HH:mm format.
 * @returns {number} The duration in hours.
 */
function calculateHoursDiff(startTimeStr, finishTimeStr) {
    const today = new Date(); // Use a dummy date for parsing time strings
    const startTime = parse(startTimeStr, 'HH:mm', today);
    let finishTime = parse(finishTimeStr, 'HH:mm', today);

    // If finish time is earlier than start time, it means it's the next day
    if (finishTime < startTime) {
        finishTime = new Date(finishTime.getTime() + (24 * 60 * 60 * 1000)); // Add 24 hours
    }

    const minutesDiff = differenceInMinutes(finishTime, startTime);
    return minutesDiff / 60; // Convert minutes to hours
}

module.exports = {
    calculateHoursDiff
}; 