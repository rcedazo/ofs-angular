import * as moment from 'moment';
import { AppConfig } from 'src/app/app.config';

export function filterEditedEvents(events) {
	return events.filter((event) => isEditedEvent(event));
}
export function filterFutureEvents(events) {
	return events.filter((event) => isFutureEvent(event));
}
export function filterCurrentEvent(events) {
	return events.filter((event) => isCurrentEvent(event));
}
export function filterPastEvents(events) {
	return events.filter((event) => isPastEvent(event));
}

export function filterUserEvents(events, userId) {
	return events.filter((event) => isFromSameUser(event, userId));
}
export function isEditedEvent(event) {
	return event.extendedProps.edited === true;
}
export function isPastEvent(event): boolean {
	return moment(event.end).isBefore(moment.now());
}

export function isCurrentEvent(event): boolean {
	return moment(event.end).isAfter(moment.now()) && moment(event.start).isBefore(moment.now());
}
export function isBelowMaximumDuration(eventToCheck): boolean {
	let maximumDuration = AppConfig.settings.bookings.max_booking_time_hours
		? AppConfig.settings.bookings.max_booking_time_hours
		: 4;
	var duration = moment.duration(moment(eventToCheck.end).diff(moment(eventToCheck.start)));
	return duration.asHours() <= maximumDuration;
}

export function isFromSameUser(eventToCheck, userId): boolean {
	return eventToCheck.extendedProps.userId === userId;
}

export function isFutureEvent(eventToCheck): boolean {
	return moment(eventToCheck.start).isAfter(moment.now());
}

export function isBelowLimitPerUser(userId, events): boolean {
	const BookingsPerUserLimit = AppConfig.settings.bookings.max_bookings_per_user
		? AppConfig.settings.bookings.max_bookings_per_user
		: 2;
	const upcomingEventsByUser = events.filter(
		(event) => event.extendedProps.userId === userId && (isFutureEvent(event) || isCurrentEvent(event))
	);
	return upcomingEventsByUser.length < BookingsPerUserLimit;
}

export function isAnOverlapEvent(eventToCheck, events): boolean {
	const resourceID = eventToCheck.resourceId;
	const startMoment = moment(eventToCheck.start);
	const endMoment = moment(eventToCheck.end);

	try {
		if (moment.isMoment(startMoment) && moment.isMoment(endMoment)) {
			// Filter Events by a specific resource
			const eventsByResource = events.filter((event) => event.resourceId === resourceID);
			for (let i = 0; i < eventsByResource.length; i++) {
				const eventA = eventsByResource[i];
				const startA = moment(eventA.start);
				const endA = moment(eventA.end);
				if (moment.isMoment(startA) && moment.isMoment(endA)) {
					// start-time in between any of the events
					if (moment(startMoment).isAfter(startA) && moment(startMoment).isBefore(endA)) {
						console.log('start-time in between any of the events');
						return true;
					}
					//end-time in between any of the events
					if (moment(endMoment).isAfter(startA) && moment(endMoment).isBefore(endA)) {
						console.log('end-time in between any of the events');
						return true;
					}
					//any of the events in between/on the start-time and end-time
					if (moment(startMoment).isSameOrBefore(startA) && moment(endMoment).isSameOrAfter(endA)) {
						console.log('any of the events in between/on the start-time and end-time');
						return true;
					}
				} else {
					const error =
						'Error, Any event on array of events is not valid. start or end are not Moment objects';
					console.error(error);
					throw new Error(error);
				}
			}
			return false;
		} else {
			const error = 'Error, start or end are not Moment objects';
			console.error(error);
			throw new Error(error);
		}
	} catch (error) {
		console.error(error);
		throw error;
	}
}
