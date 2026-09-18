function FavoritesSection({ favorites }) {
  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-3">
        ⭐ Favorite Problems
      </h2>

      <div className="space-y-2 max-h-[200px] overflow-y-auto">
        {favorites.length === 0 ? (
          <div className="text-gray-400">
            No favorites added yet.
          </div>
        ) : (
          favorites.map((fav, idx) => (
            <div
              key={idx}
              className="bg-gray-800 p-3 rounded-xl"
            >
              {fav}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default FavoritesSection;