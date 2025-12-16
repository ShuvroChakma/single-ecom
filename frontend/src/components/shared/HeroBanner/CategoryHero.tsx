import {
  Award,
  BadgeDollarSign,
  CircleDollarSign,
  Coins,
  Ear,
  Flower2,
  Gem,
  Heart,
  Link2,
  Sparkles,
  Watch,
} from 'lucide-react'

interface Category {
  id: number
  name: string
  icon: React.ReactNode
  bgColor: string
}

const CATEGORIES: Array<Category> = [
  {
    id: 1,
    name: 'Best Sellers',
    icon: <Award className="w-8 h-8" />,
    bgColor: 'bg-purple-400',
  },
  {
    id: 2,
    name: 'New Arrivals',
    icon: <Sparkles className="w-8 h-8" />,
    bgColor: 'bg-pink-300',
  },
  {
    id: 3,
    name: 'Coins & Bars',
    icon: <Coins className="w-8 h-8" />,
    bgColor: 'bg-amber-900',
  },
  {
    id: 4,
    name: 'Coin Pendants',
    icon: <CircleDollarSign className="w-8 h-8" />,
    bgColor: 'bg-yellow-600',
  },
  {
    id: 5,
    name: 'Silver Coins',
    icon: <BadgeDollarSign className="w-8 h-8" />,
    bgColor: 'bg-rose-900',
  },
  {
    id: 6,
    name: 'Gold Jhumka',
    icon: <Gem className="w-8 h-8" />,
    bgColor: 'bg-emerald-700',
  },
  {
    id: 7,
    name: 'Ring',
    icon: <Heart className="w-8 h-8" />,
    bgColor: 'bg-stone-200',
  },
  {
    id: 8,
    name: 'Bangle',
    icon: <Flower2 className="w-8 h-8" />,
    bgColor: 'bg-amber-400',
  },
  {
    id: 9,
    name: 'Earring',
    icon: <Ear className="w-8 h-8" />,
    bgColor: 'bg-sky-200',
  },
  {
    id: 10,
    name: 'Mangalsutra',
    icon: <Link2 className="w-8 h-8" />,
    bgColor: 'bg-pink-200',
  },
  {
    id: 11,
    name: 'Gold Chain',
    icon: <Watch className="w-8 h-8" />,
    bgColor: 'bg-orange-200',
  },
]

export default function CategoryHero() {
  return (
    <div className="w-full bg-linear-to-b from-gray-50 to-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Category Grid */}
        <div
          className="flex overflow-x-auto gap-8 pb-4 px-2"
          style={
            {
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            } as React.CSSProperties
          }
        >
          {CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="flex flex-col items-center gap-3 min-w-[110px] cursor-pointer group shrink-0"
            >
              {/* Icon Circle */}
              <div
                className={`
                  ${category.bgColor} 
                  w-24 h-24 rounded-full 
                  flex items-center justify-center 
                  text-white
                  shadow-lg
                  transition-all duration-300
                  group-hover:scale-110 group-hover:shadow-2xl
                  border-4 border-white
                `}
              >
                {category.icon}
              </div>

              {/* Category Name */}
              <span className="text-sm font-semibold text-gray-800 text-center whitespace-nowrap">
                {category.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
