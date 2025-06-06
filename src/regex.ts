// https://stackoverflow.com/questions/22483214/regex-check-if-input-still-has-chances-to-become-matching/41580048#41580048
type PartialMatchRegex = RegExp & {
  toPartialMatchRegex: () => RegExp
}
;(RegExp.prototype as PartialMatchRegex).toPartialMatchRegex = function () {
  var re = this,
    source = this.source,
    i = 0

  function process() {
    var result = "",
      tmp

    function appendRaw(nbChars: number) {
      result += source.substr(i, nbChars)
      i += nbChars
    }

    function appendOptional(nbChars: number) {
      result += "(?:" + source.substr(i, nbChars) + "|$)"
      i += nbChars
    }

    while (i < source.length) {
      switch (source[i]) {
        case "\\":
          switch (source[i + 1]) {
            case "c":
              appendOptional(3)
              break

            case "x":
              appendOptional(4)
              break

            case "u":
              if (re.unicode) {
                if (source[i + 2] === "{") {
                  appendOptional(source.indexOf("}", i) - i + 1)
                } else {
                  appendOptional(6)
                }
              } else {
                appendOptional(2)
              }
              break

            case "p":
            case "P":
              if (re.unicode) {
                appendOptional(source.indexOf("}", i) - i + 1)
              } else {
                appendOptional(2)
              }
              break

            case "k":
              appendOptional(source.indexOf(">", i) - i + 1)
              break

            default:
              appendOptional(2)
              break
          }
          break

        case "[":
          tmp = /\[(?:\\.|.)*?\]/g
          tmp.lastIndex = i
          tmp = tmp.exec(source)
          appendOptional(tmp![0].length)
          break

        case "|":
        case "^":
        case "$":
        case "*":
        case "+":
        case "?":
          appendRaw(1)
          break

        case "{":
          tmp = /\{\d+,?\d*\}/g
          tmp.lastIndex = i
          tmp = tmp.exec(source)
          if (tmp) {
            appendRaw(tmp[0].length)
          } else {
            appendOptional(1)
          }
          break

        case "(":
          if (source[i + 1] == "?") {
            switch (source[i + 2]) {
              case ":":
                result += "(?:"
                i += 3
                result += process() + "|$)"
                break

              case "=":
                result += "(?="
                i += 3
                result += process() + ")"
                break

              case "!":
                tmp = i
                i += 3
                process()
                result += source.substr(tmp, i - tmp)
                break

              case "<":
                switch (source[i + 3]) {
                  case "=":
                  case "!":
                    tmp = i
                    i += 4
                    process()
                    result += source.substr(tmp, i - tmp)
                    break

                  default:
                    appendRaw(source.indexOf(">", i) - i + 1)
                    result += process() + "|$)"
                    break
                }
                break
            }
          } else {
            appendRaw(1)
            result += process() + "|$)"
          }
          break

        case ")":
          ++i
          return result

        default:
          appendOptional(1)
          break
      }
    }

    return result
  }

  return new RegExp(process(), this.flags)
}

export function earliestPossibleMatchIndex(
  text: string,
  regex: RegExp,
): { start: number; end: number } {
  const match = (regex as PartialMatchRegex).toPartialMatchRegex().exec(text)
  return match
    ? { start: match.index, end: match.index + match[0].length }
    : { start: text.length, end: text.length }
}

export function escapeRegex(string: string) {
  return string.replace(/[/\-\\^$*+?.()|[\]{}]/g, "\\$&")
}

export const toGlobalRegex = (separator: RegExp | string) => {
  return typeof separator === "string"
    ? new RegExp(escapeRegex(separator), "g")
    : new RegExp(
        separator.source,
        separator.flags.includes("g") ? separator.flags : separator.flags + "g",
      )
}

export const toNonGlobalRegex = (separator: RegExp | string) => {
  return typeof separator === "string"
    ? new RegExp(escapeRegex(separator))
    : new RegExp(separator.source, separator.flags)
}

export const isPatternEmpty = (pattern: RegExp | string) => {
  return typeof pattern === "string"
    ? pattern.length === 0
    : pattern.source.length === 0
}

export const toRegex = (pattern: RegExp | string) => {
  return typeof pattern === "string"
    ? new RegExp(escapeRegex(pattern))
    : pattern
}
