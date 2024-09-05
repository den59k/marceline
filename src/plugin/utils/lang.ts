export function bytesForHuman (bytes: number | undefined): string {
  if (typeof (bytes) !== 'number') {
    return 'Unknown'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

  let i = 0

  for (i; bytes > 1024; i++) {
    bytes /= 1024
  }

  return `${Math.trunc(bytes * 10) / 10} ${units[i]}`
}

export const addDelimiter = (str: string) => {
  let resp = ''
  for (let i = str.length; i > 0; i -= 3) {
    if (i === str.length) {
      resp = str.slice(Math.max(i - 3, 0), i)
    } else {
      resp = str.slice(Math.max(i - 3, 0), i) + ' ' + resp
    }
  }
  return resp
}

export function numeral(count: number, one: string, two: string, five: string){
	if(!count) count = 0;
	//десять-девятнадцать
	if(count%100/10>>0 === 1)
		return five;
	//ноль, пять-девять
	if(count%10 >= 5 || count%10===0)
		return five;
	//один
	if(count%10 === 1)
		return one;

	//две-четыре
	return two;
}

export function num(count: number | undefined | null | false, one: string, two: string, five: string){
  if (typeof count !== "number") return ""
	return count + " " + numeral(count, one, two, five)
}

export const capitalize = (str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1)
}
