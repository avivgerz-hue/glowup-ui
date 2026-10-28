export default function Button({ variant = "primary", className = "", ...props }) {
  const styles = {
    primary: "bg-blue-600 text-white",
    secondary: "bg-gray-200 text-black",
    danger: "bg-red-600 text-white",
  };
  return <button className={`px-3 py-1 rounded ${styles[variant]} ${className}`} {...props} />;
}
