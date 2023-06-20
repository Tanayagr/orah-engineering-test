export interface Person {
  id: number
  first_name: string
  last_name: string
  photo_url?: string
}

export const PersonHelper = {
  getFullNameByFirstName: (p: Person) => `${p.first_name} ${p.last_name}`,
  getFullNameByLastName: (p: Person) => `${p.last_name} ${p.first_name}`,
}
