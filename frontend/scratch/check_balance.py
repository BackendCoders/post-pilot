
def check_balance(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    stack = []
    pairs = {'(': ')', '{': '}', '[': ']'}
    for i, char in enumerate(content):
        if char in pairs:
            stack.append((char, i))
        elif char in pairs.values():
            if not stack:
                print(f"Extra closing {char} at index {i}")
                # Print context
                print(content[max(0, i-20):min(len(content), i+20)])
            else:
                top_char, top_idx = stack.pop()
                if pairs[top_char] != char:
                    print(f"Mismatched {top_char} at {top_idx} with {char} at {i}")
                    print("Context around start:", content[max(0, top_idx-20):min(len(content), top_idx+20)])
                    print("Context around end:", content[max(0, i-20):min(len(content), i+20)])
    
    for char, idx in stack:
        print(f"Unclosed {char} at index {idx}")
        print("Context:", content[max(0, idx-20):min(len(content), idx+20)])

check_balance(r'c:\Users\teamb\Desktop\Team\post-pilot\frontend\src\pages\dashboard\lead-generation\inbox\index.tsx')
