
export const CATEGORIES = [
    "PITI",
    "Gas & Electric",
    "Sewer & Water",
    "Cleaning",
    "Lawn",
    "HVAC",
    "Pest Control",
    "Internet",
    "Maintenance",
    "Property Management",
    "Other",
  ];
  
  export const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  
  export function formatMoney(amount) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
  