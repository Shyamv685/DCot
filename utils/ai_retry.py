import time
import litellm

def call_model_with_retry(prompt, model="openrouter/openai/gpt-4.1", max_retries=5):
    """
    Call AI model with retry logic for handling API overload and temporary failures.

    Args:
        prompt (str): The prompt to send to the model
        model (str): The model to use (default: openrouter/openai/gpt-4.1)
        max_retries (int): Maximum number of retry attempts (default: 5)

    Returns:
        dict: The model's response

    Raises:
        Exception: If all retry attempts fail
    """
    for attempt in range(max_retries):
        try:
            return litellm.completion(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
        except litellm.APIError as e:
            if "overloaded" in str(e).lower() or "rate limit" in str(e).lower():
                wait_time = 2 ** attempt  # Exponential backoff
                print(f"Provider overloaded or rate limited. Retrying in {wait_time} seconds... (attempt {attempt+1}/{max_retries})")
                time.sleep(wait_time)
            else:
                # For other API errors, don't retry
                raise e
        except Exception as e:
            # For network errors or other issues, retry with exponential backoff
            if attempt < max_retries - 1:
                wait_time = 2 ** attempt
                print(f"Request failed: {str(e)}. Retrying in {wait_time} seconds... (attempt {attempt+1}/{max_retries})")
                time.sleep(wait_time)
            else:
                raise e

# Example usage with different models
def example_usage():
    prompt = "Hello! Can you help me with a coding question?"

    # Using GPT-4.1
    try:
        response = call_model_with_retry(prompt, model="openrouter/openai/gpt-4.1")
        print("GPT-4.1 Response:", response.choices[0].message.content)
    except Exception as e:
        print(f"GPT-4.1 failed: {e}")

    # Using Llama 3.3
    try:
        response = call_model_with_retry(prompt, model="openrouter/meta-llama/llama-3.3-70b")
        print("Llama 3.3 Response:", response.choices[0].message.content)
    except Exception as e:
        print(f"Llama 3.3 failed: {e}")

    # Using Qwen 2.5
    try:
        response = call_model_with_retry(prompt, model="openrouter/qwen/qwen-2.5-72b")
        print("Qwen 2.5 Response:", response.choices[0].message.content)
    except Exception as e:
        print(f"Qwen 2.5 failed: {e}")

if __name__ == "__main__":
    example_usage()
