import { Link } from "react-router";
import { getBooking } from "../booking.js";
import { serviceById, formatPrice } from "../data.js";

export default function Confirmation() {
  const booking = getBooking();
  if (!booking) {
    return (
      <div>
        <h1 className="text-2xl font-bold">No booking yet</h1>
        <p>You have not made a booking in this session.</p>
        <Link to="/book" className="text-blue-600 underline">Book a treatment</Link>
      </div>
    );
  }
  const service = serviceById(booking.serviceId);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Booking confirmed</h1>
      <p className="mb-4">Thank you, {booking.name}. A confirmation has been sent to {booking.email}.</p>
      <table className="border border-gray-300 mb-4">
        <tbody>
          <tr><td className="p-2 text-gray-500">Reference</td><td className="p-2 font-bold">{booking.reference}</td></tr>
          <tr><td className="p-2 text-gray-500">Treatment</td><td className="p-2">{service.name}</td></tr>
          <tr><td className="p-2 text-gray-500">When</td><td className="p-2">{booking.date} at {booking.time}</td></tr>
          <tr><td className="p-2 text-gray-500">Price</td><td className="p-2">{formatPrice(service.price)}</td></tr>
        </tbody>
      </table>
      <Link to="/" className="text-blue-600 underline">Back to home</Link>
    </div>
  );
}
