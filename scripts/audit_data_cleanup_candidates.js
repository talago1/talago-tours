const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== AUDITING CLEANUP CANDIDATES ===\n');

  // 1. Booking Leads with null contact info (anonymous clicks with zero customer value)
  const anonymousLeads = await prisma.bookingLead.count({
    where: {
      customerPhone: null,
      customerEmail: null,
      customerName: null,
    },
  });
  console.log('1. Anonymous leads with zero contact info:', anonymousLeads);

  const leadsWithContact = await prisma.bookingLead.findMany({
    where: {
      OR: [
        { customerPhone: { not: null } },
        { customerEmail: { not: null } },
      ],
    },
    select: {
      id: true,
      status: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      createdAt: true,
      tourSlug: true,
    },
  });
  console.log('Valid leads with contact info (' + leadsWithContact.length + '):', leadsWithContact.length);

  // 2. Customer Profiles
  const profiles = await prisma.customerProfile.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      isShadow: true,
      createdAt: true,
    },
  });
  console.log('\n2. All Customer Profiles (' + profiles.length + '):', profiles);

  // 3. LiveChatConversations with zero messages
  const emptyConversations = await prisma.liveChatConversation.findMany({
    where: {
      messages: { none: {} },
    },
    select: { id: true, visitorName: true, bookingReference: true, createdAt: true },
  });
  console.log('\n3. Empty LiveChatConversations (0 messages):', emptyConversations.length);

  // 4. LiveChatConversations with messages but orphaned (bookingReference points to non-existent booking)
  const allConversations = await prisma.liveChatConversation.findMany({
    select: {
      id: true,
      bookingReference: true,
      visitorName: true,
      visitorEmail: true,
      _count: { select: { messages: true } },
    },
  });

  const allBookingsRefs = new Set(
    (await prisma.booking.findMany({ select: { bookingReference: true } }))
      .map(b => b.bookingReference)
  );

  let orphanedConversations = 0;
  for (const c of allConversations) {
    if (c.bookingReference && !allBookingsRefs.has(c.bookingReference)) {
      orphanedConversations++;
    }
  }
  console.log('4. Conversations referencing non-existent bookingReference:', orphanedConversations);
  console.log('Total conversations:', allConversations.length);

  // 5. Abandoned checkouts
  const abandoned = await prisma.abandonedCheckout.findMany();
  console.log('\n5. Abandoned checkouts (' + abandoned.length + '):', abandoned);

  // 6. NotificationLog audit
  const notifLogs = await prisma.notificationLog.findMany({
    select: {
      id: true,
      channel: true,
      recipient: true,
      status: true,
      bookingId: true,
      createdAt: true,
    },
  });
  console.log('\n6. Total NotificationLogs (' + notifLogs.length + ')');
  const allBookingIds = new Set(
    (await prisma.booking.findMany({ select: { id: true } })).map(b => b.id)
  );
  const orphanedNotifLogs = notifLogs.filter(n => n.bookingId && !allBookingIds.has(n.bookingId));
  console.log('Orphaned NotificationLogs (bookingId not in DB):', orphanedNotifLogs.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
