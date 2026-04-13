import { useContext } from 'react'
import { BasketContext } from './basket-context'

export function useBasket() {
  return useContext(BasketContext)
}
