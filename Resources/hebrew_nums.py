def number_to_english(n: int) -> str:
    if n == 0:
        return "zero"

    ones = [
        "", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
        "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
        "seventeen", "eighteen", "nineteen"
    ]
    tens = [
        "", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"
    ]

    def convert_chunk(num: int) -> list[str]:
        parts = []
        if num >= 100:
            parts.append(f"{ones[num // 100]} hundred")
            num %= 100
        if num >= 20:
            t = tens[num // 10]
            u = ones[num % 10]
            parts.append(f"{t} {u}".strip())
        elif num > 0:
            parts.append(ones[num])
        return parts

    thousands_part = n // 1000
    remainder = n % 1000

    words = []
    if thousands_part > 0:
        words.extend(convert_chunk(thousands_part))
        words.append("thousand")
    if remainder > 0:
        words.extend(convert_chunk(remainder))

    return " ".join(words)


def number_to_hebrew(n: int) -> str:
    """
    Converts numbers to Hebrew cardinal number names (standard feminine counting form).
    Supports 0 <= n < 100,000 with the following rules for connective 'ו':
    - Never between thousands and hundreds (e.g., אלף שלוש מאות).
    - Exactly one 'ו' attached to the final component if it consists of tens or units
      and is preceded by a higher component (e.g., אלף שלושים ואחת, שלוש מאות שבעים וחמש).
    """
    if n == 0:
        return "אפס"

    units = [
        "", "אחת", "שתיים", "שלוש", "ארבע", "חמש",
        "שש", "שבע", "שמונה", "תשע"
    ]
    teens = [
        "עשר", "אחת עשרה", "שתים עשרה", "שלוש עשרה", "ארבע עשרה",
        "חמש עשרה", "שש עשרה", "שבע עשרה", "שמונה עשרה", "תשע עשרה"
    ]
    tens = [
        "", "", "עשרים", "שלושים", "ארבעים", "חמישים",
        "שישים", "שבעים", "שמונים", "תשעים"
    ]

    thousands = n // 1000
    remainder = n % 1000
    hundreds = remainder // 100
    rem_tens_units = remainder % 100

    components = []

    # 1. Thousands component
    if thousands == 1:
        components.append("אלף")
    elif thousands == 2:
        components.append("אלפיים")
    elif 3 <= thousands <= 10:
        masc_units = ["", "", "", "שלושת", "ארבעת", "חמשת", "ששת", "שבעת", "שמונת", "תשעת", "עשרת"]
        components.append(f"{masc_units[thousands]} אלפים")
    elif thousands > 10:
        # For thousands > 10, format without internal 'ו' if preceded/followed, or use standard form
        t_tens = thousands // 10
        t_units = thousands % 10
        if thousands < 20:
            components.append(f"{teens[thousands - 10]} אלף")
        elif t_units == 0:
            components.append(f"{tens[t_tens]} אלף")
        else:
            components.append(f"{tens[t_tens]} ו{units[t_units]} אלף")

    # 2. Hundreds component
    if hundreds == 1:
        components.append("מאה")
    elif hundreds == 2:
        components.append("מאתיים")
    elif hundreds > 2:
        components.append(f"{units[hundreds]} מאות")

    # 3. Tens and Units components (split into separate tokens)
    if rem_tens_units >= 20:
        components.append(tens[rem_tens_units // 10])
        u = rem_tens_units % 10
        if u > 0:
            components.append(units[u])
    elif rem_tens_units >= 10:
        components.append(teens[rem_tens_units - 10])
    elif rem_tens_units > 0:
        components.append(units[rem_tens_units])

    # 4. Apply single connective 'ו' to the final component:
    # Connective 'ו' applies only if there are preceding components
    # and the last component is not a hundreds/thousands block (e.g., not in "אלף שלוש מאות").
    if rem_tens_units > 0 and len(components) > 1:
        components[-1] = f"ו{components[-1]}"

    return " ".join(components)


def generate_number_list(max_n: int):
    for i in range(max_n + 1):
        print(f"{number_to_english(i)}:{number_to_hebrew(i)}")


if __name__ == "__main__":
    generate_number_list(2050)
