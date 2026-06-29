import { GiTennisBall } from "react-icons/gi";

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <GiTennisBall className="text-6xl text-orange-500 animate-bounce mb-4" />
      <h3 className="text-xl font-semibold text-slate-600">
        {text}
      </h3>
    </div>
  );
};

export default LoadingSpinner;
