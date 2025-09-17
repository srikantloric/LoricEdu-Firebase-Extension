export function getClassNameByValue(classNumber: number) {
    switch (classNumber) {
      case 1:
        return "Nursery";
      case 2:
        return "LKG";
      case 3:
        return "UKG";
      case 4:
        return "STD-1";
      case 5:
        return "STD-2";
      case 6:
        return "STD-3";
      case 7:
        return "STD-4";
      case 8:
        return "STD-5";
      case 9:
        return "STD-6";
      case 10:
        return "STD-7";
      case 11:
        return "STD-8";
      case 12:
        return "STD-9";
      case 13:
        return "STD-10";
      case 14:
        return "Pre-Nursery";
      default:
        return "N/A";
    }
  }
  