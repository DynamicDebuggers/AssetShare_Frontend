import ResourceConsole from '../components/ResourceConsole';

function BookingPage() {
  return (
    <ResourceConsole
      resourceName="Booking"
      title="Booking"
      description="Test Booking-endepunkter: hent alle, hent via id, opret, opdater og slet."
    />
  );
}

export default BookingPage;




// Mads Refaktorering

// Hvad jeg skal undersøge:
// - Hvad gør ResourceConsole?
// - Hvad betyder resourceName, title og description
// - Hvad gør funtion i en React jsx page