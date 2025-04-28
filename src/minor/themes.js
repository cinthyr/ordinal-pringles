const DOCUMENT_ROOT = document.documentElement
const ROOT_STYLES = getComputedStyle(DOCUMENT_ROOT)

const colorPicker = document.getElementById('colorPicker')
const colorGradientBox = document.getElementById('colorGradientBox')
const colorSelectorDot = document.getElementById('colorSelectorDot')
const hueSlider = document.getElementById('hueSlider')

const themeGlobals = {
    isDraggingColorPicker: false,
    currentThemeModification: 'null',
    currentHue: 0
}

function getCSSVariable(name, autofillPrefix = true){
    if(autofillPrefix) return ROOT_STYLES.getPropertyValue(`--${name}`)
    return ROOT_STYLES.getPropertyValue(name)
}

function setCSSVariable(name, value, autofillPrefix = true){
    if(autofillPrefix) DOCUMENT_ROOT.style.setProperty(`--${name}`, value)
    else DOCUMENT_ROOT.style.setProperty(name, value)
}

function makeCSSVariableArray() {
    // root.css will always be index 0
    return Array.from(document.styleSheets[0].cssRules).reduce((array, rule) => {
            return array.concat(Array.from(rule.style))
        }, []
    ).reduce((map, name) => {
        return {...map, [name]: getCSSVariable(name, false)};
    }, {})
}

function makeThemeVariableText(name){
    return name.replace(/-(\w)/g, (_, letter) => ' ' + letter.toUpperCase()).replace(/^-/g, '')
}

function makeThemeVariableBorderColor(color){
    if(color === getCSSVariable('main-background-color')) return getCSSVariable('generic-gray')
    return color
}

function updateThemeButton(element, color){
    element.style.backgroundColor = color
    element.style.borderColor = makeThemeVariableBorderColor(color)
}

function updateDotPosition(e) {
    const rect = colorGradientBox.getBoundingClientRect()
    let x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    let y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))

    colorSelectorDot.style.left = `${x}px`
    colorSelectorDot.style.top = `${y}px`

    // Calculate selected color
    const saturation = (x / rect.width) * 100;
    let lightness

    if (saturation === 0) lightness = 100 - (y / rect.height) * 100
    else lightness = 50 - (y / rect.height) * 50

    const selectedColor = `hsl(${themeGlobals.currentHue}, ${saturation}%, ${lightness}%)`
    setCSSVariable(themeGlobals.currentThemeModification, selectedColor, false)
    updateThemeButton(document.getElementById(`themeButton${themeGlobals.currentThemeModification}`), selectedColor)
}

function updateHuePosition(){
    themeGlobals.currentHue = hueSlider.value
    updateGradient()

    // Scuffed but it works and I am tired.
    const fakeEvent = {
        clientX: parseFloat(colorSelectorDot.style.left) + colorGradientBox.getBoundingClientRect().left,
        clientY: parseFloat(colorSelectorDot.style.top) + colorGradientBox.getBoundingClientRect().top
    }
    updateDotPosition(fakeEvent)
}

function updateGradient() {
    const color = `hsl(${themeGlobals.currentHue}, 100%, 50%)`

    colorGradientBox.style.background = `
        linear-gradient(to bottom, 
            transparent, 
            black
        ),
        linear-gradient(to right, 
            white, 
            ${color}
        )`
    colorGradientBox.style.backgroundBlendMode = 'multiply'
}

function showColorPicker(event, name){
    const scrollOffsets = getScrollOffsets(document.getElementById("cssVariablesContainer"))

    colorPicker.style.display = 'block'
    colorPicker.style.left = `${event.clientX + scrollOffsets.x}px`
    colorPicker.style.top = `${event.clientY + scrollOffsets.y}px`

    themeGlobals.currentThemeModification = name
    updateGradient()
}

function hideColorPicker(){
    if(!themeGlobals.isDraggingColorPicker) colorPicker.style.display = 'none'
}

function initThemeHTML(){
    const container = DOM('cssVariablesContainer')
    const keys = Object.keys(makeCSSVariableArray())
    const values = Object.values(makeCSSVariableArray())

    for (let i = 0; i < keys.length; i++) {
        const name = keys[i]
        const value = values[i]

        if(name.includes('generic')) continue

        let elementRow = document.createElement('div')
        elementRow.className = 'row flexBox'

        let text = document.createElement('div')
        text.className = 'themeTexts'
        text.id = `themeText${name}`
        text.innerText = makeThemeVariableText(name)
        elementRow.appendChild(text)

        let color = document.createElement('button')
        color.className = 'themeButton'
        color.id = `themeButton${name}`
        updateThemeButton(color, value)
        color.addEventListener('click', () => showColorPicker(event, name))
        elementRow.appendChild(color)

        container.appendChild(elementRow)
    }

    colorPicker.addEventListener('mouseleave', () => hideColorPicker())
    colorGradientBox.addEventListener('mousedown', (e) => {
        themeGlobals.isDraggingColorPicker = true
        updateDotPosition(e)
    })
    document.addEventListener('mousemove', (e) => {
        if (themeGlobals.isDraggingColorPicker) updateDotPosition(e)
    })
    document.addEventListener('mouseup', () => themeGlobals.isDraggingColorPicker = false)
    hueSlider.addEventListener('input', () => updateHuePosition())
}

