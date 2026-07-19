namespace IMS.Reporting.Designer.Services;

public sealed class DesignerHistory<T>
{
    private readonly Stack<T> _undo = new();
    private readonly Stack<T> _redo = new();

    public void Push(T snapshot)
    {
        _undo.Push(snapshot);
        _redo.Clear();
    }

    public bool CanUndo => _undo.Count > 0;
    public bool CanRedo => _redo.Count > 0;

    public T? Undo(T current)
    {
        if (!CanUndo)
            return default;
        _redo.Push(current);
        return _undo.Pop();
    }

    public T? Redo(T current)
    {
        if (!CanRedo)
            return default;
        _undo.Push(current);
        return _redo.Pop();
    }
}
