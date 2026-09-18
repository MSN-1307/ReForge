import Loading from "./ui/Loading";

function LoadingSection({ loading }) {
  if (!loading) return null;

  return <Loading />;
}

export default LoadingSection;