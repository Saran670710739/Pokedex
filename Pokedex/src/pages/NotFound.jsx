
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="px-6 py-16 text-center">
      <h1 className="text-6xl font-bold text-gray-300">
        404
      </h1>

      <p className="mt-4 text-gray-500">
        ไม่พบหน้าที่คุณกำลังหา
      </p>

      <Link
        to="/"
        className="mt-6 inline-block text-red-500 hover:underline"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}

export default NotFound;
