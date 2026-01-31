export const parseClassificationSelection = (
  groupId: string,
  itemId: string,
) => {
  const groupMatch = groupId.match(/\d+/)
  const itemMatch = itemId.match(/\d+/g)

  const group_no = groupMatch ? Number(groupMatch[0]) : null
  const item_no = itemMatch ? Number(itemMatch[0]) : null
  const sub_item_no =
    itemMatch && itemMatch.length > 1 ? Number(itemMatch[1]) : null

  return {
    group_no,
    item_no,
    sub_item_no,
  }
}

export const findRateIdForSelection = (
  rates: Array<{
    rate_id: number
    group_no: number
    item_no: string
    sub_item_no: string | null
  }>,
  groupNo: number,
  itemNo: number,
  subItemNo: number | null,
) => {
  const itemToken = `${itemNo}`
  const subToken = subItemNo ? String(subItemNo) : null
  const match = rates.find((rate) => {
    const itemBase = rate.item_no?.split(".")[0]
    const itemSub = rate.sub_item_no ?? rate.item_no?.split(".")[1] ?? null
    return (
      rate.group_no === groupNo &&
      itemBase === itemToken &&
      (subToken ? itemSub === subToken : itemSub == null)
    )
  })
  return match?.rate_id ?? null
}
