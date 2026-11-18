const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function checkAllTourRelations() {
  const [
    tours,
    bookings,
    reviews,
    timeSlots,
    availability,
    scheduleRules,
    mediaAssets,
    crew,
    fleet,
    expenses,
    abandoned,
    leads,
    transactions,
    customers,
    destinations
  ] = await Promise.all([
    p.tour.count(),
    p.booking.count(),
    p.review.count(),
    p.tourTimeSlot.count(),
    p.tourAvailability.count(),
    p.tourScheduleRule.count(),
    p.mediaAsset.count(),
    p.crewAssignment.count(),
    p.fleetAssignment.count(),
    p.tripExpense.count(),
    p.abandonedCheckout.count(),
    p.bookingLead.count(),
    p.transaction.count(),
    p.customerProfile.count(),
    p.destination.count()
  ]);

  console.log('=== COMPLETE PRODUCTION TABLE AUDIT ===');
  console.log('Tours:', tours);
  console.log('Bookings:', bookings);
  console.log('Reviews:', reviews);
  console.log('TourTimeSlots:', timeSlots);
  console.log('TourAvailability:', availability);
  console.log('TourScheduleRules:', scheduleRules);
  console.log('MediaAssets:', mediaAssets);
  console.log('CrewAssignments:', crew);
  console.log('FleetAssignments:', fleet);
  console.log('TripExpenses:', expenses);
  console.log('AbandonedCheckouts:', abandoned);
  console.log('BookingLeads:', leads);
  console.log('Transactions:', transactions);
  console.log('CustomerProfiles:', customers);
  console.log('Destinations:', destinations);

  await p.$disconnect();
}

checkAllTourRelations().catch(console.error);
