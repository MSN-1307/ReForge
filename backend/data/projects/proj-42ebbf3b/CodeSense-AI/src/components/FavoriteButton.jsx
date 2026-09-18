function FavoriteButton({ addCurrentFavorite }) {
  return (
    <button
      className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 p-3 rounded-xl"
      onClick={addCurrentFavorite}
    >
      ⭐ Add To Favorites
    </button>
  );
}

export default FavoriteButton;