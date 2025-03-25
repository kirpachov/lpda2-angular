export interface CreateReservationData {
  datetime: string;
  adults: number;
  children: number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  notes: string | null;
  lang: string;
  table_type_id: number | null;
}

export function formatReservationData(data: {
  datetime: unknown;
  adults: unknown;
  children: unknown;
  email: unknown;
  phone: unknown;
  notes: unknown;
  firstName: unknown;
  lastName: unknown;
  lang: unknown;
  tableTypeId: unknown;
}): CreateReservationData | null {
  const invalid = (fieldName: string, value: unknown) => {
    console.warn(`Invalid field ${fieldName}`, value);
    return null;
  };

  if (!(typeof data.lang === "string" && data.lang.length > 0)) return invalid(`lang`, data.lang);
  if (!(typeof data.email === "string" && data.email.length > 0)) return invalid(`email`, data.email);
  if (!(typeof data.phone === "string" && data.phone.length > 0)) return invalid(`phone`, data.phone);
  if (!(typeof data.firstName === "string" && data.firstName.length > 0)) return invalid(`firstName`, data.firstName);
  if (!(typeof data.lastName === "string" && data.lastName.length > 0)) return invalid(`lastName`, data.lastName);
  if (!(typeof data.datetime === "string" && data.datetime.length > 0)) return invalid(`datetime`, data.datetime);
  if (!(data.notes === null || (typeof data.notes === "string" && data.notes.length > 0))) return invalid(`notes`, data.notes);

  if (!(typeof data.children === "number" && data.children >= 0)) return invalid(`children`, data.children);
  if (!(typeof data.adults === "number" && data.adults >= 0)) return invalid(`adults`, data.adults);
  if (!(data.tableTypeId === null || data.tableTypeId === undefined || (typeof data.tableTypeId === "number" && data.tableTypeId >= 0))) return invalid(`tableTypeId`, data.tableTypeId);

  return {
    lang: data.lang,
    email: data.email,
    phone: data.phone,
    datetime: data.datetime,
    children: data.children,
    notes: data.notes,
    adults: data.adults,
    first_name: data.firstName,
    last_name: data.lastName,
    table_type_id: data.tableTypeId || null
  }
}