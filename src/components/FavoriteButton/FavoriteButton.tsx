type FavoriteButtonProps = {
  isFavorite: boolean
  onClick: () => void
}

const FavoriteButton = ({ isFavorite, onClick }: FavoriteButtonProps) => {
  return (
    <button
      className={`favorite-button${isFavorite ? ' favorite-button--active' : ''}`}
      type="button"
      onClick={onClick}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      {'\u2665'}
    </button>
  )
}

export default FavoriteButton
